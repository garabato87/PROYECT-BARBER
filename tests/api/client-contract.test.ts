import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { currentUser: null as null | { getIdToken: ReturnType<typeof vi.fn> } } }));
vi.mock('../../src/services/firebase', () => ({ auth: mocks.auth }));
import { appointmentApi, ApiError } from '../../src/services/api';

const payload = { barbershopId: 'shop', professionalId: 'pro', serviceId: 'service', date: '2026-10-01', startTime: '10:00' };
describe('authenticated appointment client', () => {
  beforeEach(() => {
    mocks.auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('synthetic-token') };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, id: 'appointment', status: 'pending', notificationStatus: 'queued' }) }));
    vi.stubGlobal('crypto', { randomUUID: () => 'fixed-uuid' });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('creates through one authenticated command without calling the dispatcher', async () => {
    await appointmentApi.create(payload);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/create-appointment', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer synthetic-token' }), body: JSON.stringify({ ...payload, requestId: 'fixed-uuid' }),
    }));
  });
  it('changes state through one authenticated command', async () => {
    await appointmentApi.update('shop', 'appointment', 'cancelled');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects a missing session with a controlled error before any request', async () => {
    mocks.auth.currentUser = null;
    await expect(appointmentApi.create(payload)).rejects.toBeInstanceOf(ApiError);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not expose token errors', async () => {
    mocks.auth.currentUser!.getIdToken.mockRejectedValue(new Error('sensitive token details'));
    await expect(appointmentApi.create(payload)).rejects.toMatchObject({ status: 401, message: 'Tu sesión expiró. Iniciá sesión nuevamente.' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('reports non-JSON server failures without leaking their body', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('raw upstream detail'); } } as unknown as Response);
    await expect(appointmentApi.create(payload)).rejects.toMatchObject({ status: 502, message: 'No pudimos procesar la solicitud. Intentá nuevamente.' });
  });
  it('preserves a slot conflict code for the booking flow', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'SLOT_TAKEN' }) } as Response);
    await expect(appointmentApi.create(payload)).rejects.toMatchObject({ status: 409, message: 'SLOT_TAKEN' });
  });
  it('sends manual contacts only inside the staff contact contract', async () => {
    const manual = { ...payload, manualContact: { name: 'Cliente de prueba', phone: '1100000000' } };
    await appointmentApi.create(manual);
    expect(fetch).toHaveBeenCalledWith('/api/create-appointment', expect.objectContaining({ body: JSON.stringify({ ...manual, requestId: 'fixed-uuid' }) }));
  });
  it.each([401, 403, 500])('sanitizes server error bodies for status %s', async status => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status, json: async () => ({ error: 'internal sensitive detail' }) } as Response);
    const result = appointmentApi.create(payload);
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.not.toHaveProperty('message', 'internal sensitive detail');
  });
  it('reports network failure with a controlled error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network internal detail'));
    await expect(appointmentApi.create(payload)).rejects.toMatchObject({ status: 0, message: 'No pudimos conectar. Revisá tu conexión e intentá nuevamente.' });
  });
  it('rejects an empty successful response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => null } as Response);
    await expect(appointmentApi.create(payload)).rejects.toMatchObject({ status: 502 });
  });
});
