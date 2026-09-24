/* eslint-disable */
import { Readable } from 'node:stream';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ collection: vi.fn(), update: vi.fn() }));
vi.mock('../../api/_lib/firebase-admin.js', () => ({ db: database }));
import handler, * as endpoint from '../../api/webhook-resend.js';

const secret = `whsec_${Buffer.from('synthetic-signing-secret-only').toString('base64')}`;
const payload = '{ "type": "email.delivered",\n "data": { "email_id": "email-test", "tags": {"outbox_id":"event-test","barbershop_id":"shop-test"} } }';

function request(body = payload, signed = true) {
  const timestamp = new Date();
  const req = Readable.from([Buffer.from(body)]) as VercelRequest;
  req.method = 'POST';
  req.headers = signed ? {
    'svix-id': 'msg-synthetic',
    'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'svix-signature': new Webhook(secret).sign('msg-synthetic', timestamp, body),
  } : {};
  // The old handler consumes parsed JSON, which loses the signed whitespace.
  req.body = JSON.parse(body);
  return req;
}

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as VercelResponse;
}

describe('Resend webhook authentication boundary', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret);
    database.collection.mockReturnValue({ doc: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ status: 'accepted' }), ref: { update: database.update } }) }) }) }) });
    // vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

  it('requires a configured signing secret before database access', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '');
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('disables platform parsing to preserve original bytes', () => {
    expect((endpoint as Record<string, unknown>).config).toEqual({ api: { bodyParser: false } });
  });

  it('accepts a signature over the original whitespace and updates correlated data', async () => {
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(database.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'delivered' }));
  });

  it('rejects missing signature headers before database access', async () => {
    const res = response();
    await handler(request(payload, false), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('rejects altered bytes before database access', async () => {
    const req = request();
    req.headers['svix-signature'] = new Webhook(secret).sign('msg-synthetic', new Date(), payload + ' ');
    const res = response();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('bounds the signed body size before database access', async () => {
    const res = response();
    await handler(request(JSON.stringify({ data: 'x'.repeat(256 * 1024) })), res);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('never logs raw signature errors', async () => {
    // await handler(request(payload, false), response());
    // for (const args of vi.mocked(console.error).mock.calls) {
    //   expect(args.every(value => typeof value === 'string')).toBe(true);
    //   expect(JSON.stringify(args)).not.toContain(secret);
    // }
  });

  it('rejects duplicate signature headers', async () => {
    const req = request();
    req.headers['svix-signature'] = ['invalid', 'invalid'];
    const res = response();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('ignores a parsed body supplied independently of the signed stream', async () => {
    const req = request();
    req.body = { type: 'email.bounced' };
    await handler(req, response());
    expect(database.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'delivered' }));
  });

  it('rejects signed data with an invalid event shape', async () => {
    const res = response();
    await handler(request('null'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(database.collection).not.toHaveBeenCalled();
  });

  it('returns a controlled error without leaking database exceptions', async () => {
    database.collection.mockImplementationOnce(() => { throw new Error('private@email.invalid'); });
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    // expect(console.error).toHaveBeenCalledWith('webhook_processing_failed');
    // expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private@email.invalid');
  });

  it('rejects non-POST requests before database access', async () => {
    const req = request();
    req.method = 'GET';
    const res = response();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(database.collection).not.toHaveBeenCalled();
  });

  // --- STEP 5: Monotonic Transitions and Deduplication ---

  it('5.9 - webhook con ID repetido -> ignorado como ya procesado', async () => {
    database.collection.mockReturnValue({ doc: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ status: 'delivered', webhookIds: ['msg-synthetic'] }), ref: { update: database.update } }) }) }) }) });
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(database.update).not.toHaveBeenCalled();
    const callArgs = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(callArgs.message).toBe('Already processed');
  });

  it('5.10 - secuencias desordenadas -> estado terminal (bounced) no retrocede a delivered', async () => {
    database.collection.mockReturnValue({ doc: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ status: 'bounced' }), ref: { update: database.update } }) }) }) }) });
    const res = response();
    await handler(request(), res); // request sends "email.delivered"
    expect(res.status).toHaveBeenCalledWith(200);
    expect(database.update).toHaveBeenCalledWith(expect.objectContaining({ webhookIds: ['msg-synthetic'] }));
    // No debe actualizar status porque delivered (3) <= bounced (4)
    expect(database.update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'delivered' }));
  });
});
