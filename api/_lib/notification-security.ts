import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Machine endpoints accept only the server credential, never a Firebase user token. */
export function requireCronSecret(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return false;
  }
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) {
    res.status(503).json({ error: 'Notification service unavailable' });
    return false;
  }
  const authorization = req.headers.authorization;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = typeof authorization === 'string' ? Buffer.from(authorization) : Buffer.alloc(0);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function notificationMode(): 'off' | 'test' | 'live' {
  const mode = process.env.NOTIFICATIONS_MODE;
  return mode === 'test' || mode === 'live' ? mode : 'off';
}

export function senderConfiguration(mode: 'test' | 'live') {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const testRecipient = process.env.NOTIFICATIONS_TEST_RECIPIENT?.trim();
  const email = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
  const senderAddress = from?.match(/<([^<>]+)>$/)?.[1] ?? from;
  if (!apiKey || !from || /[\r\n]/.test(from) || !senderAddress || !email.test(senderAddress)) return null;
  if (mode === 'live' && senderAddress.toLowerCase().endsWith('@resend.dev')) return null;
  if (mode === 'test' && (!testRecipient || !email.test(testRecipient))) return null;
  return { apiKey, from, testRecipient };
}
