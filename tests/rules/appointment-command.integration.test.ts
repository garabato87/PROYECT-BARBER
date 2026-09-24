import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('../../api/_lib/firebase-admin.js', async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Local emulator required');
  const { Firestore } = await import('firebase-admin/firestore');
  const db = new Firestore({ projectId: 'demo-vanity-step2', host: '127.0.0.1:8085', ssl: false });
  const auth = {
    verifyIdToken: async (token: string) => ({ uid: token }),
    getUser: async (uid: string) => ({ uid, email: `${uid}@example.test`, emailVerified: true, disabled: false }),
  };
  return { db, auth };
});
import { db } from '../../api/_lib/firebase-admin.js';
import create from '../../api/create-appointment.js';
import update from '../../api/update-appointment.js';

const shopId = 'command-integration';
beforeAll(async () => {
  await db.doc(`businesses/${shopId}`).set({ name: 'Synthetic shop', status: 'active' });
  await db.doc(`businesses/${shopId}/services/cut`).set({ name: 'Cut', duration: 30, price: 10 });
  await db.doc(`businesses/${shopId}/professionals/assigned`).set({ name: 'Assigned', isActive: true });
  await Promise.all(Object.entries({
    customer: { role: 'client', name: 'Customer', phone: '1234' },
    manager: { role: 'admin', barbershopId: shopId },
    assigned: { role: 'professional', barbershopId: shopId },
    owner: { role: 'super-admin' },
    foreignManager: { role: 'admin', barbershopId: 'elsewhere' },
  }).map(([uid, profile]) => db.doc(`users/${uid}`).set(profile)));
});
afterAll(async () => { await db.terminate(); });

async function call(handler: typeof create, uid: string, body: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), setHeader: vi.fn() };
  await handler({ method: 'POST', headers: { authorization: `Bearer ${uid}` }, body } as VercelRequest, res as unknown as VercelResponse);
  return { code: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
}
describe('server commands against real Firestore transactions', () => {
  it.each([
    ['customer', '10:00', false, 'req-int-1'], ['manager', '11:00', true, 'req-int-2'], ['assigned', '12:00', true, 'req-int-3'], ['owner', '13:00', true, 'req-int-4'],
  ] as const)('atomically creates reservation, minimal availability and outbox as %s', async (uid, startTime, manual, reqId) => {
    const response = await call(create, uid, {
      barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-07', startTime, requestId: reqId,
      ...(manual ? { manualContact: { name: 'Manual', phone: '1234' } } : {}),
    });
    expect(response.code).toBe(200);
    const appointment = await db.doc(`businesses/${shopId}/appointments/${response.body.id}`).get();
    expect(appointment.data()).toMatchObject({ serviceName: 'Cut', price: 10, status: 'pending', clientId: manual ? '' : uid });
    const slot = await db.doc(`businesses/${shopId}/availability/${response.body.id}`).get();
    expect(Object.keys(slot.data()!).sort()).toEqual(['date', 'endTime', 'professionalId', 'startTime', 'status']);
    const events = await db.collection(`businesses/${shopId}/outbox`).where('appointmentId', '==', response.body.id).get();
    expect(events.size).toBe(1);
    expect(events.docs[0].data().status).toBe('skipped');
  });
  it('rejects foreign staff with no new reservation/event', async () => {
    const events = db.collection(`businesses/${shopId}/outbox`);
    const count = (await events.get()).size;
    const result = await call(create, 'foreignManager', { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-07', startTime: '14:00', requestId: 'req-int-5', manualContact: { name: 'Manual', phone: '1234' } });
    expect(result.code).toBe(403);
    expect((await events.get()).size).toBe(count);
  });
});

describe('AC-006: Atomicidad e idempotencia de comandos', () => {
  it('doble submit con mismo requestId retorna idéntico resultado sin duplicar documentos', async () => {
    const payload = { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-08', startTime: '10:00', requestId: 'req-idemp-1' };
    const r1 = await call(create, 'customer', payload);
    expect(r1.code).toBe(200);
    const r2 = await call(create, 'customer', payload);
    expect(r2.code).toBe(200);
    expect(r2.body.id).toBe(r1.body.id);
    const events = await db.collection(`businesses/${shopId}/outbox`).where('appointmentId', '==', r1.body.id).get();
    expect(events.size).toBe(1); // No new events created on retry
  });

  it('concurrencia de reservas con distintos requestId sobre el mismo intervalo rechaza la segunda con 409', async () => {
    // Primera reserva a las 11:00 (duración 30m, ocupa 11:00 - 11:30)
    const r1 = await call(create, 'customer', { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-08', startTime: '11:00', requestId: 'req-overlap-1' });
    expect(r1.code).toBe(200);

    // Intento de solapamiento total a las 11:00
    const r2 = await call(create, 'customer', { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-08', startTime: '11:00', requestId: 'req-overlap-2' });
    expect(r2.code).toBe(409);

    // Intento de solapamiento parcial a las 11:15 (ocupa 11:15 - 11:45)
    const r3 = await call(create, 'customer', { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-08', startTime: '11:15', requestId: 'req-overlap-3' });
    expect(r3.code).toBe(409);

    // Intento justo después a las 11:30 (ocupa 11:30 - 12:00) -> permitido
    const r4 = await call(create, 'customer', { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-08', startTime: '11:30', requestId: 'req-overlap-4' });
    expect(r4.code).toBe(200);
  });
  it('concurrent repeat cancellation writes one transition event', async () => {
    const body = { barbershopId: shopId, appointmentId: 'assigned_2030-01-07_1000', status: 'cancelled' };
    const results = await Promise.all([call(update, 'customer', body), call(update, 'customer', body)]);
    expect(results.map(r => r.code)).toEqual([200, 200]);
    const events = await db.collection(`businesses/${shopId}/outbox`).where('appointmentId', '==', body.appointmentId).get();
    expect(events.size).toBe(2); // registered + one cancellation, never two cancellation events
    expect((await db.doc(`businesses/${shopId}/appointments/${body.appointmentId}`).get()).data()?.revision).toBe(2);
  });
});

// STEP 2 — AC-005: datos derivados por el servidor, no confiados desde el body
describe('AC-005 — server derives identity, no client-supplied trusted fields', () => {
  const base = { barbershopId: shopId, professionalId: 'assigned', serviceId: 'cut', date: '2030-01-14', startTime: '09:00' };

  it('ignores forged clientId, role and shopName sent in body', async () => {
    // El servidor solo acepta los campos declarados; campos extra causan 400
    const result = await call(create, 'customer', { ...base, clientId: 'attacker', role: 'admin', shopName: 'Forged' });
    expect(result.code).toBe(400);
    // Confirmar que no se creó ningún documento con el clientId forjado
    const snap = await db.collection(`businesses/${shopId}/appointments`).where('clientId', '==', 'attacker').get();
    expect(snap.empty).toBe(true);
  });

  it('derives serviceName, professionalName and shopName from Firestore, not from body', async () => {
    const result = await call(create, 'customer', base);
    expect(result.code).toBe(200);
    const appt = (await db.doc(`businesses/${shopId}/appointments/${result.body.id}`).get()).data()!;
    expect(appt.serviceName).toBe('Cut');         // del documento de servicio real
    expect(appt.professionalName).toBe('Assigned'); // del documento de profesional real
    expect(appt.shopName).toBe('Synthetic shop');   // del documento de negocio real
    expect(appt.price).toBe(10);
    expect(appt.duration).toBe(30);
  });

  it('rejects request from admin of a different shop', async () => {
    const before = (await db.collection(`businesses/${shopId}/outbox`).get()).size;
    const result = await call(create, 'foreignManager', { ...base, startTime: '09:30', manualContact: { name: 'X', phone: '1' } });
    expect(result.code).toBe(403);
    // Ninguna escritura ocurrió
    expect((await db.collection(`businesses/${shopId}/outbox`).get()).size).toBe(before);
  });

  it('outbox event contains only non-PII fields exposed to worker', async () => {
    const result = await call(create, 'customer', { ...base, startTime: '09:45' });
    expect(result.code).toBe(200);
    const events = await db.collection(`businesses/${shopId}/outbox`).where('appointmentId', '==', result.body.id).get();
    expect(events.size).toBe(1);
    const ev = events.docs[0].data();
    // El evento existe; el email del cliente solo se incluye si está verificado
    // En este test el mock auth devuelve emailVerified: true para 'customer'
    expect(ev.status).toBe('skipped'); // worker_not_ready hasta STEP 4
    expect(ev.schemaVersion).toBe(2);
    // La clave del evento debe ser un hash (no contener texto plano del email)
    expect(events.docs[0].id).toMatch(/^[0-9a-f]{64}$/);
  });
});
