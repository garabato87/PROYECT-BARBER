import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';

export const config = { api: { bodyParser: false } };

const MAX_BODY_BYTES = 256 * 1024;

class BodyTooLargeError extends Error {}

async function readOriginalBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw new BodyTooLargeError();
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tagValue(tags: unknown, name: string): string {
  const value = Array.isArray(tags)
    ? tags.find((tag: unknown) => isRecord(tag) && tag.name === name)?.value
    : isRecord(tags) ? tags[name] : undefined;
  return typeof value === 'string' && value.length <= 256 && !value.includes('/') ? value : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  const headers: Record<string, string> = {};
  for (const name of ['svix-id', 'svix-timestamp', 'svix-signature']) {
    const value = req.headers[name];
    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'Invalid Signature' });
    }
    headers[name] = value;
  }

  let payload: unknown;
  try {
    const rawBody = await readOriginalBody(req);
    new Webhook(webhookSecret).verify(rawBody, headers);
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (error: unknown) {
    if (error instanceof BodyTooLargeError) {
      return res.status(413).json({ error: 'Payload too large' });
    }
    console.error('webhook_verification_failed');
    return res.status(400).json({ error: 'Invalid Signature' });
  }

  if (!isRecord(payload) || typeof payload.type !== 'string' || !isRecord(payload.data)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const { type, data } = payload;
    // Resend events: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
    const tags = data.tags;
    
    // Find outbox_id and barbershop_id from tags
    const outboxId = tagValue(tags, 'outbox_id');
    const barbershopId = tagValue(tags, 'barbershop_id');

    if (!outboxId || !barbershopId || barbershopId === 'unknown') {
       return res.status(200).json({ success: true, ignored: true });
    }

    const svixId = headers['svix-id'];
    const { db } = await import('./_lib/firebase-admin.js');
    const targetDoc = await db.collection('businesses')
                              .doc(barbershopId)
                              .collection('outbox')
                              .doc(outboxId)
                              .get();

    if (!targetDoc.exists) {
       return res.status(200).json({ success: true, message: 'Doc not found' });
    }

    const docData = targetDoc.data();
    if (!docData) {
       return res.status(200).json({ success: true, message: 'Doc data empty' });
    }

    if (Array.isArray(docData.webhookIds) && docData.webhookIds.includes(svixId)) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    const weights: Record<string, number> = {
      pending: 0, processing: 0, skipped: 0, failed: 0, unknown: 0,
      accepted: 1, sent: 2, delivered: 3, bounced: 4, complained: 4
    };

    const currentWeight = weights[docData.status] ?? 0;
    
    let newStatus = docData.status;
    switch (type) {
      case 'email.sent': newStatus = 'sent'; break;
      case 'email.delivered': newStatus = 'delivered'; break;
      case 'email.bounced': newStatus = 'bounced'; break;
      case 'email.complained': newStatus = 'complained'; break;
    }

    const newWeight = weights[newStatus] ?? 0;
    const webhookIds = Array.isArray(docData.webhookIds) ? [...docData.webhookIds, svixId].slice(-20) : [svixId];

    if (newWeight > currentWeight) {
      await targetDoc.ref.update({ status: newStatus, webhookIds, updatedAt: new Date() });
    } else {
      await targetDoc.ref.update({ webhookIds, updatedAt: new Date() });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('webhook_processing_failed', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
