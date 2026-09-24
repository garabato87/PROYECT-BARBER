import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';

const mock = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>();
  const writes: { path: string; data?: Record<string, unknown>; kind: string }[] = [];
  const tx = {
    get: vi.fn(async (ref: { path: string }) => ({ exists: records.has(ref.path), data: () => records.get(ref.path) })),
    set: vi.fn((ref: { path: string }, data: Record<string, unknown>) => { records.set(ref.path, data); writes.push({ path: ref.path, data, kind: 'set' }); }),
    update: vi.fn((ref: { path: string }, data: Record<string, unknown>) => { records.set(ref.path, { ...records.get(ref.path), ...data }); writes.push({ path: ref.path, data, kind: 'update' }); }),
    delete: vi.fn((ref: { path: string }) => { records.delete(ref.path); writes.push({ path: ref.path, kind: 'delete' }); }),
  };
  return { records, writes, tx, verifyIdToken: vi.fn(), getUserByEmail: vi.fn(), runTransaction: vi.fn(async (callback: (arg: typeof tx) => unknown) => callback(tx)) };
});
vi.mock('../../api/_lib/firebase-admin.js', () => ({
  auth: { verifyIdToken: mock.verifyIdToken, getUserByEmail: mock.getUserByEmail },
  db: { doc: (path: string) => ({ path }), runTransaction: mock.runTransaction },
}));
import handler from '../../api/manage-professional.js';

async function invoke(body: unknown = { action: 'assign', barbershopId: 'shop', email: 'target@example.test' }, authorization: unknown = 'Bearer token', method = 'POST') {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), setHeader: vi.fn() };
  await handler({ method, headers: { authorization }, body } as VercelRequest, res as unknown as VercelResponse);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks(); mock.records.clear(); mock.writes.length = 0;
  mock.verifyIdToken.mockResolvedValue({ uid: 'admin' });
  mock.getUserByEmail.mockResolvedValue({ uid: 'target', disabled: false });
  mock.records.set('users/admin', { role: 'admin', barbershopId: 'shop' });
  mock.records.set('users/target', { role: 'client', name: 'Target', email: 'private@example.test', phone: 'private' });
  mock.records.set('businesses/shop', { status: 'active' });
});

describe('professional management privacy boundary', () => {
  it.each([undefined, '', 'invalid', ['Bearer token']])('rejects invalid token header %s', async header => {
    const res = await invoke(undefined, header === undefined ? '' : header);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mock.runTransaction).not.toHaveBeenCalled();
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
  });
  it('checks revoked tokens', async () => {
    mock.verifyIdToken.mockRejectedValueOnce(new Error('revoked'));
    expect((await invoke()).status).toHaveBeenCalledWith(401);
    expect(mock.verifyIdToken).toHaveBeenCalledWith('token', true);
  });
  it.each(['client', 'professional'])('blocks %s before email lookup', async role => {
    mock.records.set('users/admin', { role, barbershopId: 'shop' });
    expect((await invoke()).status).toHaveBeenCalledWith(403);
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
  });
  it('blocks another tenant before lookup', async () => {
    mock.records.set('users/admin', { role: 'admin', barbershopId: 'other' });
    expect((await invoke()).status).toHaveBeenCalledWith(403);
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
  });
  it.each([{ disabled: true }, { status: 'suspended' }])('blocks disabled or suspended managers %s before lookup', async restriction => {
    mock.records.set('users/admin', { role: 'admin', barbershopId: 'shop', ...restriction });
    expect((await invoke()).status).toHaveBeenCalledWith(403);
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
    expect(mock.writes).toHaveLength(0);
  });
  it.each([{ disabled: true }, { status: 'suspended' }])('rechecks manager restrictions %s after lookup', async restriction => {
    mock.getUserByEmail.mockImplementationOnce(async () => {
      mock.records.set('users/admin', { role: 'admin', barbershopId: 'shop', ...restriction });
      return { uid: 'target' };
    });
    expect((await invoke()).status).toHaveBeenCalledWith(403);
    expect(mock.writes.filter(write => !write.path.startsWith('professional_management_limits/'))).toHaveLength(0);
  });
  it.each([
    { action: 'assign', barbershopId: 'shop', email: 'target@example.test', professionalId: 'other' },
    { action: 'remove', barbershopId: 'shop', professionalId: 'target', email: 'target@example.test' },
    { action: 'assign', barbershopId: 'shop', email: 'target@example.test', role: 'super-admin' },
  ])('rejects ambiguous or unknown command fields', async body => {
    expect((await invoke(body)).status).toHaveBeenCalledWith(400);
    expect(mock.runTransaction).not.toHaveBeenCalled();
  });
  it('assigns atomically without publishing contact data', async () => {
    expect((await invoke()).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('users/target')).toMatchObject({ role: 'professional', barbershopId: 'shop' });
    expect(mock.records.get('businesses/shop/professionals/target')).toMatchObject({ name: 'Target', isActive: true });
    expect(mock.records.get('businesses/shop/professionals/target')).not.toHaveProperty('email');
    expect(mock.records.get('businesses/shop/professionals/target')).not.toHaveProperty('phone');
  });
  it.each([{ role: 'admin' }, { role: 'super-admin' }, { role: 'professional', barbershopId: 'other' }])('does not transfer privileged or foreign profiles %s', async profile => {
    mock.records.set('users/target', profile);
    expect((await invoke()).status).toHaveBeenCalledWith(409);
    expect(mock.writes.filter(write => write.path.startsWith('businesses/'))).toHaveLength(0);
  });
  it('limits exact-email searches persistently before Auth lookup', async () => {
    mock.records.set('professional_management_limits/admin', { windowStartedAt: Date.now(), count: 10 });
    expect((await invoke()).status).toHaveBeenCalledWith(429);
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
  });
  it('returns same unavailable result for nonexistent and foreign users', async () => {
    mock.getUserByEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    expect((await invoke()).json).toHaveBeenCalledWith({ error: 'Professional unavailable' });
  });
  it('preserves administrator role when adding and removing self', async () => {
    mock.getUserByEmail.mockResolvedValueOnce({ uid: 'admin' });
    expect((await invoke()).status).toHaveBeenCalledWith(200);
    expect((await invoke({ action: 'remove', barbershopId: 'shop', professionalId: 'admin' })).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('users/admin')).toMatchObject({ role: 'admin', barbershopId: 'shop' });
  });
  it('removes a same-local professional and clears membership', async () => {
    mock.records.set('users/target', { role: 'professional', barbershopId: 'shop' });
    mock.records.set('businesses/shop/professionals/target', { name: 'Target' });
    expect((await invoke({ action: 'remove', barbershopId: 'shop', professionalId: 'target' })).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('users/target')?.role).toBe('client');
    expect(mock.records.has('businesses/shop/professionals/target')).toBe(false);
    expect(mock.writes.find(write => write.path === 'users/target')?.data?.barbershopId).toEqual(FieldValue.delete());
  });
  it('rechecks permissions after lookup before mutation', async () => {
    mock.getUserByEmail.mockImplementationOnce(async () => {
      mock.records.set('users/admin', { role: 'client' });
      return { uid: 'target' };
    });
    expect((await invoke()).status).toHaveBeenCalledWith(403);
    expect(mock.writes.filter(write => write.path.startsWith('businesses/'))).toHaveLength(0);
  });
  it('lets super administrators manage a specified tenant without changing their role', async () => {
    mock.records.set('users/admin', { role: 'super-admin' });
    expect((await invoke()).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('users/admin')?.role).toBe('super-admin');
  });
  it('rejects disabled and missing profiles', async () => {
    mock.getUserByEmail.mockResolvedValueOnce({ uid: 'target', disabled: true });
    expect((await invoke()).status).toHaveBeenCalledWith(409);
    mock.records.delete('users/target');
    expect((await invoke()).status).toHaveBeenCalledWith(409);
  });
  it('rolls rate limit window forward after one hour', async () => {
    mock.records.set('professional_management_limits/admin', { windowStartedAt: Date.now() - 3_600_001, count: 10 });
    expect((await invoke()).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('professional_management_limits/admin')?.count).toBe(1);
  });
  it('keeps existing working hours when assignment is retried', async () => {
    const projection = { name: 'Existing', workingDays: { 0: { isOpen: true } } };
    mock.records.set('users/target', { role: 'professional', barbershopId: 'shop' });
    mock.records.set('businesses/shop/professionals/target', projection);
    expect((await invoke()).status).toHaveBeenCalledWith(200);
    expect(mock.records.get('businesses/shop/professionals/target')).toEqual(projection);
  });
  it('rejects foreign removal without changing the profile', async () => {
    mock.records.set('users/target', { role: 'professional', barbershopId: 'other' });
    expect((await invoke({ action: 'remove', barbershopId: 'shop', professionalId: 'target' })).status).toHaveBeenCalledWith(409);
    expect(mock.writes.filter(write => write.path.startsWith('users/'))).toHaveLength(0);
  });
  it('does not expose lookup provider errors', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mock.getUserByEmail.mockRejectedValueOnce(new Error('secret@example.test'));
    expect((await invoke()).status).toHaveBeenCalledWith(500);
    expect(log).toHaveBeenCalledWith('professional_management_failed');
    log.mockRestore();
  });
  it('rejects unsupported methods', async () => {
    expect((await invoke(undefined, 'Bearer token', 'GET')).status).toHaveBeenCalledWith(405);
    expect(mock.verifyIdToken).not.toHaveBeenCalled();
  });
  it.each([{ action: 'assign', barbershopId: '../x', email: 'a@b.test' }, { action: 'assign', barbershopId: 'shop', email: 'bad' }, { action: 'remove', barbershopId: 'shop', professionalId: 'a/b' }])('rejects malformed input', async body => {
    expect((await invoke(body)).status).toHaveBeenCalledWith(400);
    expect(mock.getUserByEmail).not.toHaveBeenCalled();
  });
});
