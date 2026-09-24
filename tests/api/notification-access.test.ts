import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { inspect } from 'node:util';

const mocks = vi.hoisted(() => {
  const get = vi.fn().mockResolvedValue({ empty: true, docs: [] });
  const query = { where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(), get };
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return { get, collection: vi.fn(() => query), collectionGroup: vi.fn(() => query), send: vi.fn() };
});
vi.mock('../../api/_lib/firebase-admin.js', () => ({ db: mocks }));
vi.mock('resend', () => ({ Resend: class { emails = { send: mocks.send }; } }));

import dispatch from '../../api/dispatch-outbox.js';
import cron from '../../api/cron-reminder.js';

function response() {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'synthetic-cron-secret');
  vi.stubEnv('NOTIFICATIONS_MODE', 'test');
  vi.stubEnv('RESEND_API_KEY', 're_synthetic');
  vi.stubEnv('RESEND_FROM', 'Vanity <test@example.test>');
  vi.stubEnv('NOTIFICATIONS_TEST_RECIPIENT', 'recipient@example.test');
  mocks.get.mockResolvedValue({ empty: true, docs: [] });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe.each([['dispatcher', dispatch], ['cron', cron]] as const)('%s access control', (_name, handler) => {
  it.each([
    ['missing', {}],
    ['arbitrary bearer', { authorization: 'Bearer invalid' }],
    ['raw secret', { authorization: 'synthetic-cron-secret' }],
    ['alternate header', { 'x-cron-secret': 'synthetic-cron-secret' }],
    ['multiple headers', { authorization: ['Bearer synthetic-cron-secret', 'Bearer invalid'] }],
  ])('rejects %s before database/provider access', async (_case, headers) => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = response();
    await handler({ method: 'GET', headers, query: { bypass: 'dev' } } as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.collection).not.toHaveBeenCalled();
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '   '])('fails closed when secret is %s', async secret => {
    vi.stubEnv('CRON_SECRET', secret);
    const res = response();
    await handler({ method: 'GET', headers: { authorization: `Bearer ${secret}` }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'invalid', 'LIVE', 'off'])('does no work with mode %s', async mode => {
    vi.stubEnv('NOTIFICATIONS_MODE', mode);
    const res = response();
    await handler({ method: 'GET', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Notifications are OFF' });
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('permits an authorized empty batch', async () => {
    const res = response();
    await handler({ method: 'GET', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.collectionGroup).toHaveBeenCalledTimes(1);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects unsupported methods before database access', async () => {
    const res = response();
    await handler({ method: 'DELETE', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
  });

  it('does not leak database errors in response or logs', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.get.mockRejectedValueOnce(new Error('private@example.test secret-value'));
    const res = response();
    await handler({ method: 'GET', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(inspect([res.json.mock.calls, log.mock.calls])).not.toMatch(/private@example|secret-value/);
  });
});

describe('dispatcher configuration', () => {
  it.each(['RESEND_API_KEY', 'RESEND_FROM', 'NOTIFICATIONS_TEST_RECIPIENT'])('requires %s before reading the queue', async name => {
    vi.stubEnv(name, '');
    const res = response();
    await dispatch({ method: 'GET', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([
    ['test', 'RESEND_FROM', 'malformed'],
    ['test', 'RESEND_FROM', 'Vanity\r\n<sender@example.test>'],
    ['test', 'NOTIFICATIONS_TEST_RECIPIENT', 'one@example.test,two@example.test'],
    ['live', 'RESEND_FROM', 'Vanity <onboarding@resend.dev>'],
  ])('rejects invalid %s configuration %s', async (mode, variable, value) => {
    vi.stubEnv('NOTIFICATIONS_MODE', mode);
    vi.stubEnv(variable, value);
    const res = response();
    await dispatch({ method: 'GET', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(mocks.collectionGroup).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('does not require a test recipient in live mode', async () => {
    vi.stubEnv('NOTIFICATIONS_MODE', 'live');
    vi.stubEnv('NOTIFICATIONS_TEST_RECIPIENT', '');
    const res = response();
    await dispatch({ method: 'POST', headers: { authorization: 'Bearer synthetic-cron-secret' }, query: {} } as VercelRequest, res as unknown as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.collectionGroup).toHaveBeenCalledTimes(1);
  });
});
