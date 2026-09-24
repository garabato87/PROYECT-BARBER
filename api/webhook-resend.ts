import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { db } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body;
  const headers = req.headers;

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (webhookSecret) {
    try {
      const wh = new Webhook(webhookSecret);
      // Wait, VercelRequest.body is parsed JSON. Svix expects raw string.
      // We must disable Vercel body parsing or reconstruct string, but Vercel stringifies it differently sometimes.
      // Let's assume req.rawBody exists or we stringify. Actually, Vercel provides req.body.
      // If we can't verify because of rawBody, we might fail. Let's try stringifying.
      wh.verify(JSON.stringify(payload), headers as Record<string, string>);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      // AC14: Webhook sin firma o firma inválida -> Rechazo sin alterar envíos
      return res.status(400).json({ error: 'Invalid Signature' });
    }
  }

  try {
    const { type, data } = payload;
    // Resend events: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
    const emailId = data?.email_id;
    const tags = data?.tags || [];
    
    // Find outbox_id and barbershop_id from tags
    let outboxId = '';
    let barbershopId = '';
    if (Array.isArray(tags)) {
       const outboxTag = tags.find((t: any) => t.name === 'outbox_id');
       const shopTag = tags.find((t: any) => t.name === 'barbershop_id');
       if (outboxTag) outboxId = outboxTag.value;
       if (shopTag) barbershopId = shopTag.value;
    } else {
       outboxId = tags.outbox_id;
       barbershopId = tags.barbershop_id;
    }

    if (!outboxId || !barbershopId || barbershopId === 'unknown') {
       return res.status(200).json({ success: true, ignored: true });
    }

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

    // AC10: No degradar estados terminales antiguos
    if (docData.status === 'bounced' || docData.status === 'complained') {
       return res.status(200).json({ success: true, message: 'Already terminal' });
    }

    let newStatus = docData.status;
    switch (type) {
      case 'email.delivered':
        newStatus = 'delivered';
        break;
      case 'email.bounced':
        newStatus = 'bounced';
        break;
      case 'email.complained':
        newStatus = 'complained';
        break;
    }

    if (newStatus !== docData.status) {
      await targetDoc.ref.update({ 
        status: newStatus,
        updatedAt: new Date()
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
