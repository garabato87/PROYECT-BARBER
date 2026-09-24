// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('./notifications/model.js', () => ({ buildNotificationEvent: (input: Record<string, unknown>) => ({ id: `${input.appointmentId}-${input.revision}-${input.kind}`, data: { ...input, status: 'pending' } }) }));
import { executeAppointmentCommand, parseCommand, appointmentTime } from './appointments.js';
import type { Firestore } from 'firebase-admin/firestore';

const actor = { uid: 'u1', role: 'client', shopId: '', email: 'test@example.test', emailVerified: true };
const command = { action: 'create', requestId: '123e4567-e89b-42d3-a456-426614174000', shopId: 'shop', professionalId: 'pro', serviceId: 'service', date: '2030-01-07', startTime: '10:00' };
function fixture() {
  const data = new Map<string, Record<string, unknown>>([
    ['users/u1', { role: 'client', name: 'Client' }],
    ['businesses/shop', { name: 'Shop', status: 'active' }],
    ['businesses/shop/services/service', { name: 'Cut', duration: 60 }],
    ['businesses/shop/professionals/pro', { name: 'Pro', isActive: true, workingDays: { 1: { isOpen: true, openTime: '09:00', closeTime: '18:00' } } }],
  ]);
  const doc = (path: string) => ({ path });
  const db = { doc, collection: (path: string) => ({ doc: (id: string) => doc(`${path}/${id}`) }), runTransaction: async (fn: (tx: unknown) => unknown) => {
    const writes: Array<() => void> = [];
    const result = await fn({ get: async (ref: {path: string}) => ({ exists: data.has(ref.path), data: () => data.get(ref.path) }), set: (ref: {path: string}, value: Record<string, unknown>) => writes.push(() => { data.set(ref.path, value); }), delete: (ref: {path: string}) => writes.push(() => { data.delete(ref.path); }) });
    writes.forEach(write => write()); return result;
  } } as unknown as Firestore;
  return { db, data };
}
describe('appointment commands', () => {
  it('validates real dates and rejects arbitrary fields', () => {
    expect(() => parseCommand({ ...command, date: '2030-02-30' })).toThrow();
    expect(() => parseCommand({ ...command, clientId: 'someone' })).toThrow();
    expect(appointmentTime('2030-01-07', '10:00', 'America/Argentina/Buenos_Aires')).toBe(Date.UTC(2030, 0, 7, 13));
  });
  it('atomically creates private appointment, minimal availability and durable events; duplicate request is stable', async () => {
    const { db, data } = fixture();
    const result = await executeAppointmentCommand(db, actor, command, 0);
    expect(result.eventIds).toHaveLength(2);
    expect(data.get(`businesses/shop/appointments/${result.appointmentId}`)?.clientEmail).toBe(actor.email);
    expect(Object.keys(data.get(`businesses/shop/availability/${result.appointmentId}`)!)).toEqual(['professionalId', 'date', 'startTime', 'endTime', 'status']);
    expect(await executeAppointmentCommand(db, actor, command, 0)).toEqual(result);
    expect([...data.keys()].filter(key => key.startsWith('notificationOutbox/'))).toHaveLength(2);
  });
  it('rejects overlap at a different start time and permits rebooking after cancellation', async () => {
    const { db } = fixture();
    const first = await executeAppointmentCommand(db, actor, command, 0);
    const second = { ...command, requestId: '223e4567-e89b-42d3-a456-426614174000', startTime: '10:30' };
    await expect(executeAppointmentCommand(db, actor, second, 0)).rejects.toThrow('SLOT_TAKEN');
    await executeAppointmentCommand(db, actor, { action: 'status', requestId: '323e4567-e89b-42d3-a456-426614174000', shopId: 'shop', appointmentId: first.appointmentId, status: 'cancelled' }, 0);
    await expect(executeAppointmentCommand(db, actor, second, 0)).resolves.toMatchObject({ status: 'pending' });
  });
  it('rejects forged roles and cross-local manual bookings with no writes', async () => {
    const { db, data } = fixture();
    const count = data.size;
    await expect(executeAppointmentCommand(db, { ...actor, role: 'admin', shopId: 'shop' }, { ...command, manualContact: { name: 'Other' } }, 0)).rejects.toThrow();
    expect(data.size).toBe(count);
  });
  it('rejects different payload reuse of a request id', async () => {
    const { db } = fixture();
    await executeAppointmentCommand(db, actor, command, 0);
    await expect(executeAppointmentCommand(db, actor, { ...command, startTime: '11:00' }, 0)).rejects.toThrow('REQUEST_ID_REUSED');
  });
});
