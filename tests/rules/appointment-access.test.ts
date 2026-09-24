import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

let env: RulesTestEnvironment;
const projectId = 'demo-vanity-step2';
const apptPath = 'businesses/shop/appointments/booking';
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Use the isolated Firestore emulator on 127.0.0.1:8085');
  env = await initializeTestEnvironment({ projectId, firestore: {
    host: '127.0.0.1', port: 8085, rules: readFileSync('firestore.rules', 'utf8'),
  } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all(Object.entries({
      client: { role: 'client', name: 'Client', email: 'client@example.test' },
      stranger: { role: 'client' },
      pro: { role: 'professional', barbershopId: 'shop' },
      otherPro: { role: 'professional', barbershopId: 'shop' },
      outsider: { role: 'professional', barbershopId: 'other' },
      admin: { role: 'admin', barbershopId: 'shop' },
      otherAdmin: { role: 'admin', barbershopId: 'other' },
      super: { role: 'super-admin' },
    }).map(([uid, data]) => setDoc(doc(db, 'users', uid), data)));
    await setDoc(doc(db, 'businesses/shop'), { status: 'active', ownerId: 'admin' });
    await setDoc(doc(db, apptPath), { clientId: 'client', professionalId: 'pro', status: 'pending', date: '2030-01-07', clientEmail: 'client@example.test' });
    await setDoc(doc(db, 'businesses/shop/availability/booking'), { professionalId: 'pro', date: '2030-01-07', startTime: '10:00', endTime: '10:30', status: 'pending' });
    await setDoc(doc(db, 'businesses/shop/professionals/pro'), { name: 'Pro', isActive: true });
    await setDoc(doc(db, 'businesses/shop/outbox/notice'), { status: 'pending', payload: { to: 'client@example.test' } });
  });
});
afterAll(async () => { await env?.cleanup(); });
const dbFor = (uid: string) => uid === 'anonymous' ? env.unauthenticatedContext().firestore() : env.authenticatedContext(uid).firestore();

describe('private appointments and public availability', () => {
  it.each(['anonymous', 'stranger', 'outsider', 'otherAdmin', 'otherPro'])('denies private reads for %s', async uid => {
    await assertFails(getDoc(doc(dbFor(uid), apptPath)));
  });
  it.each(['client', 'pro', 'admin', 'super'])('allows authorized reads for %s', async uid => {
    await assertSucceeds(getDoc(doc(dbFor(uid), apptPath)));
  });
  it.each(['anonymous', 'client', 'pro', 'admin', 'super'])('denies direct appointment and availability writes for %s', async uid => {
    const db = dbFor(uid);
    await assertFails(updateDoc(doc(db, apptPath), { status: 'cancelled' }));
    await assertFails(setDoc(doc(db, 'businesses/shop/appointments/new'), { clientId: uid, status: 'pending' }));
    await assertFails(deleteDoc(doc(db, apptPath)));
    await assertFails(setDoc(doc(db, 'businesses/shop/availability/new'), { status: 'pending' }));
    await assertFails(getDoc(doc(db, 'businesses/shop/outbox/notice')));
  });
  it('allows anonymous availability query without private reservations', async () => {
    await assertSucceeds(getDocs(collection(dbFor('anonymous'), 'businesses/shop/availability')));
    await assertFails(getDocs(collection(dbFor('anonymous'), 'businesses/shop/appointments')));
  });
  it('allows own collection-group query but rejects unfiltered enumeration', async () => {
    const db = dbFor('client');
    await assertSucceeds(getDocs(query(collectionGroup(db, 'appointments'), where('clientId', '==', 'client'))));
    await assertFails(getDocs(collectionGroup(db, 'appointments')));
  });
  it('allows professional query with assignment constraint only', async () => {
    const db = dbFor('pro');
    await assertSucceeds(getDocs(query(collection(db, 'businesses/shop/appointments'), where('professionalId', '==', 'pro'))));
    await assertFails(getDocs(collection(db, 'businesses/shop/appointments')));
  });
});

describe('profile access cannot bypass server authorization', () => {
  it.each(['anonymous', 'pro', 'admin', 'otherAdmin'])('denies unrelated global profile reads for %s', async uid => {
    await assertFails(getDoc(doc(dbFor(uid), 'users/client')));
    await assertFails(getDocs(collection(dbFor(uid), 'users')));
  });
  it('allows own and superadministrator profiles', async () => {
    await assertSucceeds(getDoc(doc(dbFor('client'), 'users/client')));
    await assertSucceeds(getDocs(collection(dbFor('super'), 'users')));
  });
  it('denies direct staff reassignment and self privilege changes', async () => {
    await assertFails(updateDoc(doc(dbFor('admin'), 'users/client'), { role: 'professional', barbershopId: 'shop' }));
    await assertFails(updateDoc(doc(dbFor('client'), 'users/client'), { role: 'admin' }));
    await assertFails(setDoc(doc(dbFor('newUser'), 'users/newUser'), { role: 'client', barbershopId: 'shop' }));
  });
  it('denies professional writes in other tenants and public contact additions', async () => {
    await assertFails(setDoc(doc(dbFor('pro'), 'businesses/other/professionals/pro'), { name: 'Pro' }));
    await assertFails(updateDoc(doc(dbFor('pro'), 'businesses/shop/professionals/pro'), { phone: '123456' }));
    await assertFails(updateDoc(doc(dbFor('admin'), 'businesses/shop/professionals/pro'), { email: 'private@example.test' }));
  });
  it('allows scoped public profile and schedule edits', async () => {
    await assertSucceeds(updateDoc(doc(dbFor('pro'), 'businesses/shop/professionals/pro'), { photoURL: '' }));
    await assertSucceeds(updateDoc(doc(dbFor('admin'), 'businesses/shop/professionals/pro'), { isActive: false }));
  });
});

// STEP 2 — AC-003: aislamiento por actor y local
describe('AC-003 — cross-shop isolation', () => {
  it('denies foreign professional read of another shop appointment', async () => {
    // outsider = professional con barbershopId:'other'; el turno pertenece a 'shop'
    await assertFails(getDoc(doc(dbFor('outsider'), apptPath)));
  });
  it('denies foreign admin read of another shop appointment', async () => {
    // otherAdmin = admin con barbershopId:'other'
    await assertFails(getDoc(doc(dbFor('otherAdmin'), apptPath)));
  });
  it('denies stranger client read of another client appointment', async () => {
    // stranger = client sin clientId coincidente con el turno
    await assertFails(getDoc(doc(dbFor('stranger'), apptPath)));
  });
  it('denies unfiltered appointment listing to professional in own shop', async () => {
    // El profesional no puede enumerar todos los turnos: solo los suyos con filtro
    await assertFails(getDocs(collection(dbFor('pro'), 'businesses/shop/appointments')));
  });
  it('denies own-shop admin collection-group query across all shops', async () => {
    // Un admin solo puede leer appointments de su shop vía colección específica, no vía collectionGroup global
    await assertFails(getDocs(collectionGroup(dbFor('admin'), 'appointments')));
  });
  it('allows in-shop admin to read any appointment in their shop', async () => {
    await assertSucceeds(getDoc(doc(dbFor('admin'), apptPath)));
  });
  it('allows assigned professional to read own appointment', async () => {
    // pro tiene professionalId == 'pro' y barbershopId == 'shop'
    await assertSucceeds(getDoc(doc(dbFor('pro'), apptPath)));
  });
});

// STEP 2 — AC-004: no existe bypass de escritura directa vía match recursivo
describe('AC-004 — no write bypass through recursive match', () => {
  it('denies client direct cancel via SDK (must use API)', async () => {
    await assertFails(updateDoc(doc(dbFor('client'), apptPath), { status: 'cancelled' }));
  });
  it('denies client create via SDK', async () => {
    await assertFails(setDoc(doc(dbFor('client'), 'businesses/shop/appointments/new-direct'), { clientId: 'client', status: 'pending' }));
  });
  it('denies recursive-match write from client on collection-group path', async () => {
    // El path {path=**}/appointments/{apptId} debe tener write bloqueado
    await assertFails(setDoc(doc(dbFor('client'), apptPath), { clientId: 'client', status: 'pending' }));
  });
  it('denies outbox write from any client identity', async () => {
    await assertFails(setDoc(doc(dbFor('client'), 'businesses/shop/outbox/malicious'), { type: 'confirmation', status: 'pending' }));
    await assertFails(setDoc(doc(dbFor('stranger'), 'businesses/shop/outbox/malicious'), { type: 'confirmation', status: 'pending' }));
  });
  it('denies availability write from authenticated professional', async () => {
    await assertFails(updateDoc(doc(dbFor('pro'), 'businesses/shop/availability/booking'), { status: 'cancelled' }));
  });
});
