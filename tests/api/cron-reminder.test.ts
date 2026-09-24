/* eslint-disable */
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mock = vi.hoisted(() => {
  const data = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  
  const getSnapshot = vi.fn(async function(this: any) {
    const docs = Array.from(data.entries())
      .filter(([k, v]) => k.includes('/appointments/') && typeof v === 'object' && v !== null && ['pending', 'confirmed'].includes((v as any).status) && !(v as any).reminderQueued && (v as any).date === this._targetDate)
      .slice(0, this._limit || 50)
      .map(([k, v]) => ({
        id: k.split('/').pop()!,
        ref: { path: k },
        data: () => v
      }));
    return { empty: docs.length === 0, size: docs.length, docs };
  });

  const queryBuilder = (targetDate?: string, limit?: number): any => ({
    _targetDate: targetDate,
    _limit: limit,
    where: function(field: string, op: string, val: any) {
      if (field === 'date' && op === '==') return queryBuilder(val, this._limit);
      return this;
    },
    orderBy: function() { return this; },
    limit: function(l: number) { return queryBuilder(this._targetDate, l); },
    startAfter: function() { return this; },
    get: getSnapshot
  });

  const collectionGroup = vi.fn(() => queryBuilder());
  
  const batch = vi.fn(() => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, val: any) => ops.push(() => { data.set(ref.path, val); writes.push(ref.path); }),
      update: (ref: any, val: any) => ops.push(() => { data.set(ref.path, { ...data.get(ref.path), ...val }); writes.push(ref.path); }),
      commit: async () => ops.forEach(op => op())
    };
  });
  
  return { data, writes, collectionGroup, batch };
});

vi.mock('../../api/_lib/firebase-admin.js', () => ({
  db: { 
    collectionGroup: mock.collectionGroup, 
    batch: mock.batch,
    collection: (c: string) => ({ doc: (d: string) => ({ collection: (sc: string) => ({ doc: (sd: string) => ({ path: `${c}/${d}/${sc}/${sd}` }) }) }) })
  }
}));

import handler from '../../api/cron-reminder.js';

describe('cron-reminder worker (STEP 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.data.clear();
    mock.writes.length = 0;
    process.env.CRON_SECRET = 'valid-secret';
    process.env.NOTIFICATIONS_MODE = 'test';
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  async function call() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), setHeader: vi.fn() };
    await handler({ method: 'POST', headers: { authorization: 'Bearer valid-secret' } } as unknown as VercelRequest, res as unknown as VercelResponse);
    return res;
  }

  it('5.11 - procesa solo eventos elegibles y respeta limite de lote', async () => {
    // Fijar reloj para que mañana en Buenos Aires sea 2026-09-25
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'));
    
    // Elegible
    mock.data.set('businesses/shop1/appointments/app1', { barbershopId: 'shop1', status: 'confirmed', date: '2026-09-25', clientEmail: 'a@b.com', revision: 1 });
    mock.data.set('businesses/shop1/appointments/app2', { barbershopId: 'shop1', status: 'pending', date: '2026-09-25', clientEmail: 'c@d.com', revision: 1 });
    // No elegibles
    mock.data.set('businesses/shop1/appointments/app3', { barbershopId: 'shop1', status: 'cancelled', date: '2026-09-25', clientEmail: 'e@f.com', revision: 1 });
    mock.data.set('businesses/shop1/appointments/app4', { barbershopId: 'shop1', status: 'confirmed', date: '2026-09-26', clientEmail: 'g@h.com', revision: 1 }); // Wrong date

    const res = await call();
    expect(res.status).toHaveBeenCalledWith(200);
    const json = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(json.processed).toBe(2);
    
    const outbox1 = mock.data.get('businesses/shop1/outbox/app1_reminder') as any;
    expect(outbox1).toBeDefined();
    expect(outbox1.type).toBe('reminder');
    expect(outbox1.appointmentId).toBe('app1');
    expect(outbox1.schemaVersion).toBe(2);

    const app1 = mock.data.get('businesses/shop1/appointments/app1') as any;
    expect(app1.reminderQueued).toBe(true);
  });

  it('5.12 - fixtures de zona horaria: resuelve mañana en Buenos Aires correctamente (borde del dia)', async () => {
    // 2026-09-24T02:00:00Z = 2026-09-23T23:00:00-03:00 (Buenos Aires)
    // Mañana en Buenos Aires = 2026-09-24
    vi.setSystemTime(new Date('2026-09-24T02:00:00Z'));
    
    mock.data.set('businesses/shop1/appointments/app1', { status: 'confirmed', date: '2026-09-24', clientEmail: 'a@b.com', revision: 1 });
    const res = await call();
    const json = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(json.dateTarget).toBe('2026-09-24');
    expect(json.processed).toBe(1);
  });

  it('5.13 - logs: sin PII en webhook ni cron', async () => {
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'));
    mock.data.set('businesses/shop1/appointments/app1', { status: 'confirmed', date: '2026-09-25', clientEmail: 'secret@email.com', clientName: 'SecretName', revision: 1 });
    
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    mock.batch.mockImplementationOnce(() => { throw new Error('DB Error private data secret@email.com'); });

    const res = await call();
    expect(res.status).toHaveBeenCalledWith(500);
    
    const errorLogs = JSON.stringify(errorSpy.mock.calls);
    const infoLogs = JSON.stringify(logSpy.mock.calls);
    
    expect(errorLogs).not.toMatch(/secret@email\.com|SecretName/);
    expect(errorLogs).toContain('notification_cron_failed');
    
    expect(infoLogs).not.toMatch(/secret@email\.com|SecretName/);
    
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
