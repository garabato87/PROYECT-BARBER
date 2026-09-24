import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ currentUser: { uid: 'client-1', getIdToken: vi.fn() } as { uid: string; getIdToken: ReturnType<typeof vi.fn> } | null }));
vi.mock('./firebase', () => ({ auth: state }));
import { createAppointment, changeAppointmentStatus } from './appointments';
const input = { shopId: 'shop', professionalId: 'pro', serviceId: 'cut', date: '2026-10-10', startTime: '10:00' };
describe('appointment API', () => {
  beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); state.currentUser = { uid: 'client-1', getIdToken: vi.fn().mockResolvedValue('token') }; });
  it('authenticates creation and returns queue state', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ appointmentId: 'a', status: 'pending', notificationStatus: 'queued' })));
    expect(await createAppointment(input)).toMatchObject({ appointmentId: 'a', notificationStatus: 'queued' });
    expect(fetcher).toHaveBeenCalledWith('/api/appointments', expect.objectContaining({ headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' } }));
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ ...input, action: 'create', requestId: expect.any(String) });
  });
  it('keeps the same request id after an ambiguous failure', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network')).mockResolvedValue(new Response(JSON.stringify({ appointmentId: 'a', status: 'pending', notificationStatus: 'queued' })));
    await expect(createAppointment(input)).rejects.toThrow('network');
    await createAppointment(input);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).requestId).toBe(JSON.parse(String(fetcher.mock.calls[1][1]?.body)).requestId);
  });
  it('rejects HTTP errors and preserves their code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'Horario ocupado', code: 'SLOT_TAKEN' }), { status: 409 }));
    await expect(createAppointment(input)).rejects.toMatchObject({ message: 'Horario ocupado', code: 'SLOT_TAKEN' });
  });
  it('does not call the API without a signed in user', async () => {
    state.currentUser = null;
    const fetcher = vi.spyOn(globalThis, 'fetch');
    await expect(createAppointment(input)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('sends status changes through the authenticated API', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ appointmentId: 'a', status: 'cancelled', notificationStatus: 'queued' })));
    await changeAppointmentStatus({ shopId: 'shop', appointmentId: 'a', status: 'cancelled' });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ action: 'status', status: 'cancelled' });
  });
});
