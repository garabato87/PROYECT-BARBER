/* eslint-disable */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Mocks for Firebase Admin
const mock = vi.hoisted(() => {
  const data = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  
  const get = vi.fn(async (ref: { path: string }) => ({ exists: data.has(ref.path), data: () => data.get(ref.path) }));
  const runTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const pending: Array<() => void> = [];
    const tx = {
      get,
      set: (r: {path:string}, value: Record<string,unknown>) => pending.push(() => {data.set(r.path,value);writes.push(r.path);}),
      update: (r: {path:string}, value: Record<string,unknown>) => pending.push(() => {data.set(r.path,{...data.get(r.path),...value});writes.push(r.path);})
    };
    const result = await fn(tx);
    pending.forEach(commit => commit());
    return result;
  });

  const getSnapshot = vi.fn(async () => {
    const docs = Array.from(data.entries())
      .filter(([k, v]) => k.includes('/outbox/') && typeof v === 'object' && v !== null && ['pending', 'processing'].includes((v as Record<string, unknown>).status as string))
      .map(([k, v]) => ({
        id: k.split('/').pop()!,
        ref: { path: k, update: vi.fn(async (val) => { data.set(k, { ...data.get(k), ...val }); writes.push(k); }) },
        data: () => v
      }));
    return { empty: docs.length === 0, docs };
  });

  const limitObj = { get: getSnapshot };
  const whereObj = { limit: () => limitObj };
  const collectionGroup = vi.fn(() => ({ where: () => whereObj }));
  
  return { data, writes, get, runTransaction, collectionGroup, getSnapshot };
});

vi.mock('../../api/_lib/firebase-admin.js', () => ({
  db: { collectionGroup: mock.collectionGroup, runTransaction: mock.runTransaction, doc: (path: string) => ({ path, get: () => mock.get({ path }) }) }
}));

const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  }
}));

import handler from '../../api/dispatch-outbox.js';

describe('dispatch-outbox worker (STEP 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.data.clear();
    mock.writes.length = 0;
    process.env.CRON_SECRET = 'valid-secret';
    process.env.NOTIFICATIONS_MODE = 'test';
    process.env.RESEND_API_KEY = 're_test123';
    process.env.NOTIFICATIONS_TEST_RECIPIENT = 'test@example.com';
    process.env.RESEND_FROM = 'No Reply <noreply@example.com>';
    mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null });
  });

  async function call() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), setHeader: vi.fn() };
    await handler({ method: 'POST', headers: { authorization: 'Bearer valid-secret' } } as unknown as VercelRequest, res as unknown as VercelResponse);
    return res;
  }

  it('4.16 - claims outbox document exclusively (lease control)', async () => {
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending',
      payload: { to: 'client@test.com', data: { clientName: 'Juan' } }
    });
    mock.data.set('businesses/shop1/appointments/app1', { revision: 1 });

    const res = await call();
    expect(res.status).toHaveBeenCalledWith(200);
    const updated = mock.data.get('businesses/shop1/outbox/evt1') as any;
    expect(updated.status).toBe('accepted');
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Si ya está procesado, un segundo worker lo ignora
    mockSend.mockClear();
    await call();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('4.17 - marks obsolete events as skipped without sending', async () => {
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending',
      payload: { to: 'client@test.com', data: { clientName: 'Juan' } }
    });
    // El appointment actual está en revision 2 (ya fue modificado/cancelado)
    mock.data.set('businesses/shop1/appointments/app1', { revision: 2 });

    const res = await call();
    expect(res.status).toHaveBeenCalledWith(200);
    const updated = mock.data.get('businesses/shop1/outbox/evt1') as any;
    expect(updated.status).toBe('skipped');
    expect(updated.skipReason).toBe('obsolete');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('4.15 - handles transient provider errors with backoff (429/5xx)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending', retryCount: 0,
      payload: { to: 'client@test.com', data: { clientName: 'Juan' } }
    });
    mock.data.set('businesses/shop1/appointments/app1', { revision: 1 });
    mockSend.mockResolvedValueOnce({ error: { name: 'too_many_requests', message: 'Rate limit' } });

    await call();
    const updated1 = mock.data.get('businesses/shop1/outbox/evt1') as any;
    expect(updated1.status).toBe('pending');
    expect(updated1.retryCount).toBe(1);
    expect(updated1.nextAttemptAt).toBeGreaterThan(Date.now());
    expect(mockSend).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('4.15 - handles permanent provider errors (validation) -> failed immediately', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending', retryCount: 0,
      payload: { to: 'client@test.com', data: { clientName: 'Juan' } }
    });
    mock.data.set('businesses/shop1/appointments/app1', { revision: 1 });
    mockSend.mockResolvedValueOnce({ error: { name: 'validation_error', message: 'Bad email' } });

    await call();
    const updated = mock.data.get('businesses/shop1/outbox/evt1') as any;
    expect(updated.status).toBe('failed');
    expect(updated.error).toBe('provider_rejected');
    errorSpy.mockRestore();
  });

  it('4.18 - escapes malicious HTML payloads in templates', async () => {
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending',
      payload: { to: 'client@test.com', data: { clientName: '<script>alert("xss")</script>' } }
    });
    mock.data.set('businesses/shop1/appointments/app1', { revision: 1 });

    await call();
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'),
    }));
    expect(mockSend).toHaveBeenCalledWith(expect.not.objectContaining({
      html: expect.stringContaining('<script>'),
    }));
  });
  
  it('4.19 - masks PII in logs (no names or emails)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mock.data.set('businesses/shop1/outbox/evt1', {
      barbershopId: 'shop1', appointmentId: 'app1', revision: 1, type: 'registered', status: 'pending',
      payload: { to: 'private@email.com', data: { clientName: 'SecretName' } }
    });
    mock.data.set('businesses/shop1/appointments/app1', { revision: 1 });
    mockSend.mockRejectedValue(new Error('Network error')); // Throws

    const res = await call();
    expect(res.status).toHaveBeenCalledWith(200); // 200 array but items have failure
    
    // Check logs for PII
    expect(JSON.stringify(errorSpy.mock.calls)).not.toMatch(/private@email.com|SecretName/);
    errorSpy.mockRestore();
  });
});
