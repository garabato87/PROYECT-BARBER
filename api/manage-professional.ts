import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

class ManagementError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
const unavailable = () => new ManagementError(409, 'Professional unavailable');
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

async function requireManager(db: Firestore, tx: Transaction, uid: string, shopId: string) {
  const profile = (await tx.get(db.doc(`users/${uid}`))).data();
  if (!profile || profile.disabled === true || profile.status === 'suspended' || (profile.role !== 'super-admin' && !(profile.role === 'admin' && profile.barbershopId === shopId))) {
    throw new ManagementError(403, 'Forbidden');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !/^Bearer \S+$/.test(authorization)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { db, auth } = await import('./_lib/firebase-admin.js');
    let uid: string;
    try { uid = (await auth.verifyIdToken(authorization.slice(7), true)).uid; }
    catch { return res.status(401).json({ error: 'Unauthorized' }); }
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ManagementError(400, 'Invalid request');
    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const action = body.action;
    if (action === 'assign' && keys.some(k => !['action', 'barbershopId', 'email'].includes(k))) throw new ManagementError(400, 'Invalid request');
    if (action === 'remove' && keys.some(k => !['action', 'barbershopId', 'professionalId'].includes(k))) throw new ManagementError(400, 'Invalid request');
    if (action !== 'assign' && action !== 'remove') throw new ManagementError(400, 'Invalid request');
    const { barbershopId, professionalId } = body;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!validId(barbershopId) || !['assign', 'remove'].includes(action)
      || (action === 'remove' && !validId(professionalId))
      || (action === 'assign' && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
      throw new ManagementError(400, 'Invalid request');
    }

    // Rate-limit exact-email discovery after authorization and before Auth lookup.
    await db.runTransaction(async tx => {
      await requireManager(db, tx, uid, barbershopId);
      if (!(await tx.get(db.doc(`businesses/${barbershopId}`))).exists) throw new ManagementError(403, 'Forbidden');
      const limitRef = db.doc(`professional_management_limits/${uid}`);
      const previous = (await tx.get(limitRef)).data();
      const now = Date.now();
      const withinWindow = previous && Number(previous.windowStartedAt) > now - 3_600_000;
      const count = withinWindow ? Number(previous.count) || 0 : 0;
      if (count >= 10) throw new ManagementError(429, 'Too many requests');
      tx.set(limitRef, { count: count + 1, windowStartedAt: withinWindow ? previous.windowStartedAt : now });
    });

    let targetId: string = professionalId;
    if (action === 'assign') {
      try {
        const target = await auth.getUserByEmail(email);
        if (target.disabled) throw unavailable();
        targetId = target.uid;
      } catch (error) {
        if (error instanceof ManagementError || (error as { code?: string }).code === 'auth/user-not-found') throw unavailable();
        throw error;
      }
    }
    await db.runTransaction(async tx => {
      await requireManager(db, tx, uid, barbershopId);
      const userRef = db.doc(`users/${targetId}`);
      const publicRef = db.doc(`businesses/${barbershopId}/professionals/${targetId}`);
      const target = (await tx.get(userRef)).data();
      const existing = await tx.get(publicRef);
      const selfAdmin = targetId === uid && target?.role === 'admin' && target.barbershopId === barbershopId;
      if (!target || (!selfAdmin && !['client', 'professional'].includes(target.role))
        || (target.barbershopId && target.barbershopId !== barbershopId)) throw unavailable();
      if (action === 'remove') {
        if (!existing.exists || target.barbershopId !== barbershopId) throw unavailable();
        if (!selfAdmin) tx.update(userRef, { role: 'client', barbershopId: FieldValue.delete() });
        tx.delete(publicRef);
      } else if (!existing.exists) {
        const workingDays = Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, { isOpen: day !== 0, openTime: '09:00', closeTime: day === 6 ? '14:00' : '18:00' }]));
        if (!selfAdmin) tx.update(userRef, { role: 'professional', barbershopId });
        tx.set(publicRef, { name: typeof target.name === 'string' ? target.name.slice(0, 120) : 'Profesional', photoURL: typeof target.photoURL === 'string' ? target.photoURL : '', isActive: true, workingDays });
      }
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof ManagementError) return res.status(error.status).json({ error: error.message });
    console.error('professional_management_failed');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
