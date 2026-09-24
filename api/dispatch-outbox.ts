/* eslint-disable */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { notificationMode, requireCronSecret, senderConfiguration } from './_lib/notification-security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireCronSecret(req, res)) return;
  const mode = notificationMode();
  if (mode === 'off') return res.status(200).json({ message: 'Notifications are OFF' });
  const configuration = senderConfiguration(mode);
  if (!configuration) return res.status(503).json({ error: 'Notification service unavailable' });
  const resend = new Resend(configuration.apiKey);

  try {
    const { db } = await import('./_lib/firebase-admin.js');
    const snapshot = await db.collectionGroup('outbox').where('status', 'in', ['pending', 'processing']).limit(20).get();
    if (snapshot.empty) return res.status(200).json({ message: 'No pending emails' });
    const results = [];
    const now = Date.now();

    for (const doc of snapshot.docs) {
      const claimed = await db.runTransaction(async tx => {
        const current = (await tx.get(doc.ref)).data();
        if (!current) return false;
        if (current.status === 'pending') {
          if (typeof current.nextAttemptAt === 'number' && current.nextAttemptAt > now) return false;
        } else if (current.status === 'processing') {
          if (typeof current.leaseExpiresAt === 'number' && current.leaseExpiresAt > now) return false;
        } else {
          return false;
        }
        tx.update(doc.ref, { status: 'processing', leaseExpiresAt: now + 30000 });
        return current;
      });
      if (!claimed) continue;
      
      try {
        const appointmentRef = db.doc(`businesses/${claimed.barbershopId}/appointments/${claimed.appointmentId}`);
        const appointment = (await appointmentRef.get()).data();
        if (!appointment || typeof appointment.revision !== 'number' || appointment.revision > claimed.revision) {
          await doc.ref.update({ status: 'skipped', skipReason: 'obsolete', processedAt: new Date() });
          results.push({ id: doc.id, status: 'skipped', skipReason: 'obsolete' });
          continue;
        }

        const to = claimed.payload?.to;
        const emailData = claimed.payload?.data || {};
        const recipient = mode === 'test' ? configuration.testRecipient : to;
        if (!recipient) {
          await doc.ref.update({ status: 'skipped', skipReason: 'no_recipient', processedAt: new Date() });
          results.push({ id: doc.id, status: 'skipped', skipReason: 'no_recipient' });
          continue;
        }

        const e = (str: unknown) => String(str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").substring(0, 150);
        let htmlContent = '', subject = '';
        if (claimed.type === 'registered') {
          subject = '¡Turno Confirmado!';
          htmlContent = `<div style="font-family: sans-serif; padding: 20px;"><h2>¡Turno Confirmado!</h2><p>Hola ${e(emailData.clientName)}, tu turno en <strong>${e(emailData.shopName)}</strong> ha sido confirmado.</p><ul><li><strong>Servicio:</strong> ${e(emailData.serviceName)}</li><li><strong>Profesional:</strong> ${e(emailData.professionalName)}</li><li><strong>Fecha:</strong> ${e(emailData.date)}</li><li><strong>Hora:</strong> ${e(emailData.startTime)}</li></ul><p>¡Te esperamos!</p></div>`;
        } else if (claimed.type === 'cancelled') {
          subject = 'Turno Cancelado';
          htmlContent = `<div style="font-family: sans-serif; padding: 20px;"><h2>Turno Cancelado</h2><p>Hola ${e(emailData.clientName)}, tu turno en <strong>${e(emailData.shopName)}</strong> para el ${e(emailData.date)} a las ${e(emailData.startTime)} ha sido cancelado.</p></div>`;
        } else {
          await doc.ref.update({ status: 'failed', error: 'invalid_type', processedAt: new Date() });
          results.push({ id: doc.id, status: 'failed' });
          continue;
        }

        const result = await resend.emails.send({
          from: configuration.from, to: recipient,
          subject: mode === 'test' ? `[PRUEBA] ${subject}` : subject, html: htmlContent,
          headers: { 'Idempotency-Key': doc.id },
          tags: [{ name: 'outbox_id', value: doc.id }, { name: 'barbershop_id', value: claimed.barbershopId }]
        });

        if (result.error) {
          console.error('notification_provider_rejected');
          const isTransient = (result.error.name as string) === 'too_many_requests' || (result.error.name as string) === 'internal_server_error';
          const retryCount = (claimed.retryCount || 0) + 1;
          if (isTransient && retryCount < 3) {
            await doc.ref.update({ status: 'pending', retryCount, nextAttemptAt: now + retryCount * 5000 });
            results.push({ id: doc.id, status: 'pending', retryCount });
          } else {
            await doc.ref.update({ status: 'failed', error: 'provider_rejected', retryCount, processedAt: new Date() });
            results.push({ id: doc.id, status: 'failed' });
          }
        } else if (!result.data || !result.data.id) {
          await doc.ref.update({ status: 'unknown', processedAt: new Date() });
          results.push({ id: doc.id, status: 'unknown' });
        } else {
          await doc.ref.update({ status: 'accepted', resendId: result.data.id, processedAt: new Date() });
          results.push({ id: doc.id, status: 'accepted' });
        }
      } catch (err) {
        console.error('notification_provider_failed');
        const retryCount = (claimed.retryCount || 0) + 1;
        if (retryCount < 3) {
          await doc.ref.update({ status: 'pending', retryCount, nextAttemptAt: now + retryCount * 5000 });
          results.push({ id: doc.id, status: 'pending', retryCount });
        } else {
          await doc.ref.update({ status: 'failed', error: 'provider_failed', retryCount, processedAt: new Date() });
          results.push({ id: doc.id, status: 'failed' });
        }
      }
    }
    return res.status(200).json({ success: true, processed: results.length, results });
  } catch (err) {
    console.error('notification_dispatch_failed');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
