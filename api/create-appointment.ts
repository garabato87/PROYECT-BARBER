import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAppointmentCommand } from './_lib/appointment-commands.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleAppointmentCommand('create', req, res);
}
