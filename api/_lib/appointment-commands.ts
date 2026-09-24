import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UserRecord } from 'firebase-admin/auth';
import type { DocumentData } from 'firebase-admin/firestore';
import { auth, db } from './firebase-admin.js';

class CommandError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
const fail = (status: number, message: string): never => { throw new CommandError(status, message); };
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'absent';
const transitions: Record<Status, readonly Status[]> = {
  // Legacy agendas allow closing pending appointments without explicit confirmation.
  pending: ['confirmed', 'cancelled', 'completed', 'absent'],
  confirmed: ['cancelled', 'completed', 'absent'], cancelled: [], completed: [], absent: [],
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(400, 'Invalid request');
  return value as Record<string, unknown>;
}
function onlyKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) fail(400, 'Unexpected request fields');
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(value)) return fail(400, 'Invalid identifier');
  return value;
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || [...value].some(char => char.charCodeAt(0) < 32) || (required && !value.trim())) return fail(400, 'Invalid contact');
  return value.trim();
}
function staff(profile: DocumentData, uid: string, shopId: string, professionalId: string): boolean {
  return profile.role === 'super-admin' ||
    (profile.barbershopId === shopId && (profile.role === 'admin' ||
      (profile.role === 'professional' && uid === professionalId)));
}
function requireProfile(profile: DocumentData | undefined): DocumentData {
  if (!profile || !['client', 'professional', 'admin', 'super-admin'].includes(profile.role) || profile.disabled === true || profile.status === 'suspended') return fail(403, 'Forbidden');
  return profile;
}
function projection(appointment: DocumentData, status: Status) {
  return {professionalId: appointment.professionalId, date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime, status};
}
function event(appointment: DocumentData, appointmentId: string, kind: string, revision: number) {
  const recipient = appointment.clientEmailVerified === true || appointment.contactSource === 'manual' ? appointment.clientEmail : '';
  const eligible = typeof recipient === 'string' && emailPattern.test(recipient);
  const eventId = createHash('sha256').update(`${appointmentId}:${revision}:${kind}`).digest('hex');
  return {id: eventId, data: {
    barbershopId: appointment.barbershopId, appointmentId, revision, type: kind,
    schemaVersion: 2, status: eligible ? 'pending' : 'skipped', skipReason: eligible ? null : 'no_verified_contact',
    payload: {to: eligible ? recipient : '', data: {
      clientName: appointment.clientName ?? '', shopName: appointment.shopName ?? '',
      serviceName: appointment.serviceName ?? '', professionalName: appointment.professionalName ?? '',
      date: appointment.date, startTime: appointment.startTime,
    }}, createdAt: new Date(), retryCount: 0,
  }};
}
async function createAppointment(input: Record<string, unknown>, uid: string, user: UserRecord) {
  onlyKeys(input, ['barbershopId','professionalId','serviceId','date','startTime','manualContact','requestId']);
  const shopId = id(input.barbershopId), professionalId = id(input.professionalId), serviceId = id(input.serviceId);
  // STEP 3: requestId identifies a logical attempt stably; prevents duplicate documents on retry.
  const reqId = id(input.requestId);
  const date = input.date, startTime = input.startTime;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) !== date || typeof startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return fail(400, 'Invalid date or time');
  let manual: {name: string; phone: string; email: string} | undefined;
  if (input.manualContact !== undefined) {
    const contact = record(input.manualContact); onlyKeys(contact,['name','phone','email']);
    manual = {name: text(contact.name,120,true),phone:text(contact.phone,40,true),email:contact.email === undefined ? '' : text(contact.email,254)};
    if (manual.email && !emailPattern.test(manual.email)) return fail(400,'Invalid contact');
  }
  // Stable document ID scoped to shop, derived from requestId.
  const appointmentId = createHash('sha256').update(`${shopId}:${reqId}`).digest('hex').slice(0, 28);
  const shop = db.collection('businesses').doc(shopId);
  const app = shop.collection('appointments').doc(appointmentId);
  let idempotent = false;
  let notificationQueued = false;
  await db.runTransaction(async tx => {
    const profile = requireProfile((await tx.get(db.collection('users').doc(uid))).data());
    if (manual ? !staff(profile,uid,shopId,professionalId) : profile.role !== 'client') fail(403,'Forbidden');
    const [business, serviceDoc, professional, existing] = await Promise.all([
      tx.get(shop), tx.get(shop.collection('services').doc(serviceId)), tx.get(shop.collection('professionals').doc(professionalId)), tx.get(app),
    ]);
    if (existing.exists) {
      if (existing.data()!.createdBy === uid) { idempotent = true; return; }
      fail(409, 'Slot already taken');
    }
    const service = serviceDoc.data(), pro = professional.data();
    if (!business.exists || business.data()?.status !== 'active' || !service || !pro || pro.isActive === false || service.isActive === false) fail(400,'Booking unavailable');
    if (!Number.isInteger(service!.duration) || service!.duration <= 0 || service!.duration > 1440 || typeof service!.price !== 'number' || !Number.isFinite(service!.price) || service!.price < 0) fail(400,'Invalid service');
    const [hour,minute] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + service!.duration;
    if (endMinutes >= 1440) fail(400,'Invalid service interval');
    const slotsSnap = await tx.get(shop.collection('availability').where('professionalId', '==', professionalId).where('date', '==', date).where('status', 'in', ['pending', 'confirmed']));
    for (const slotDoc of slotsSnap.docs) {
      const s = slotDoc.data();
      if (typeof s.startTime !== 'string' || typeof s.endTime !== 'string') continue;
      const [sh, sm] = (s.startTime as string).split(':').map(Number);
      const [eh, em] = (s.endTime as string).split(':').map(Number);
      if (startMinutes < (eh * 60 + em) && endMinutes > (sh * 60 + sm)) fail(409, 'Slot already taken');
    }
    const endTime = `${String(Math.floor(endMinutes/60)).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}`;
    const appointment = {
      barbershopId:shopId, professionalId, serviceId, requestId:reqId, clientId:manual ? '' : uid,
      createdBy:uid, contactSource:manual ? 'manual' : 'account',
      clientName:manual?.name ?? String(profile.name ?? '').slice(0,120),
      clientPhone:manual?.phone ?? String(profile.phone ?? '').slice(0,40),
      clientEmail:manual?.email ?? (user.emailVerified ? user.email ?? '' : ''),
      clientEmailVerified:!manual && user.emailVerified === true,
      shopName:String(business.data()?.name ?? '').slice(0,120), serviceName:String(service!.name ?? '').slice(0,120),professionalName:String(pro!.name ?? '').slice(0,120),
      price:service!.price,duration:service!.duration,date,startTime,endTime,
      status:'pending' as const,revision:1,schemaVersion:2,createdAt:new Date(),
    };
    const notification = event(appointment,appointmentId,'registered',1);
    notificationQueued = notification.data.status === 'pending';
    tx.set(app,appointment);tx.set(shop.collection('availability').doc(appointmentId),projection(appointment,'pending'));tx.set(shop.collection('outbox').doc(notification.id),notification.data);
  });
  if (idempotent) {
    const existSnap = await app.get();
    return {success:true,id:appointmentId,status:existSnap.data()!.status as Status,notificationStatus:'skipped'};
  }
  return {success:true,id:appointmentId,status:'pending',notificationStatus: notificationQueued ? 'queued' : 'skipped'};
}
async function updateAppointment(input: Record<string,unknown>,uid:string) {
  let notificationQueued = false;
  onlyKeys(input,['barbershopId','appointmentId','status']);
  const shopId=id(input.barbershopId),appointmentId=id(input.appointmentId);
  if (typeof input.status !== 'string' || !['confirmed','cancelled','completed','absent'].includes(input.status)) return fail(400,'Invalid status');
  const status=input.status as Status,shop=db.collection('businesses').doc(shopId),app=shop.collection('appointments').doc(appointmentId);
  await db.runTransaction(async tx=>{
    const profile=requireProfile((await tx.get(db.collection('users').doc(uid))).data());
    const snapshot=await tx.get(app);if(!snapshot.exists) fail(404,'Appointment not found');
    const appointment=snapshot.data()!;
    const canStaff=staff(profile,uid,shopId,appointment.professionalId);
    if(!canStaff && !(profile.role==='client' && appointment.clientId===uid && status==='cancelled')) fail(403,'Forbidden');
    if(appointment.status===status) return;
    if(!Object.prototype.hasOwnProperty.call(transitions,appointment.status) || !transitions[appointment.status as Status].includes(status)) fail(409,'Invalid status transition');
    const revision=Number.isInteger(appointment.revision) ? appointment.revision+1 : 1;
    tx.update(app,{status,revision,updatedAt:new Date()});
    tx.set(shop.collection('availability').doc(appointmentId),projection(appointment,status));
    if(status==='cancelled' || status==='confirmed') {
      const notification=event({...appointment,barbershopId:shopId},appointmentId,status==='cancelled'?'cancellation':'confirmation',revision);
      notificationQueued = notification.data.status === 'pending';
      tx.set(shop.collection('outbox').doc(notification.id),notification.data);
    }
  });
  return {success:true,id:appointmentId,status,notificationStatus: notificationQueued ? 'queued' : 'skipped'};
}
export async function handleAppointmentCommand(kind:'create'|'update',req:VercelRequest,res:VercelResponse) {
  if(req.method!=='POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'Method Not Allowed'});}
  const header=req.headers.authorization;
  if(typeof header!=='string' || !/^Bearer [^\s]+$/.test(header)) return res.status(401).json({error:'Unauthorized'});
  let uid:string;
  let user:UserRecord;
  try {
    uid=(await auth.verifyIdToken(header.slice(7),true)).uid;
    user=await auth.getUser(uid);
    if(user.disabled) return res.status(401).json({error:'Unauthorized'});
  } catch {return res.status(401).json({error:'Unauthorized'});}
  try {
    const input=record(req.body);
    const result = kind==='create'?await createAppointment(input,uid,user):await updateAppointment(input,uid);
    return res.status(200).json(result);
  } catch(error) {
    if(error instanceof CommandError) return res.status(error.status).json({error:error.message});
    console.error('appointment_command_failed');
    return res.status(500).json({error:'Internal Server Error'});
  }
}





