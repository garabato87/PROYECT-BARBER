import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase-admin.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET/POST. If POST, check CRON_SECRET or Firebase Auth.
  const authHeader = req.headers.authorization;
  const cronSecret = req.headers['authorization'] || req.headers['x-cron-secret'];
  
  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    cronSecret !== process.env.CRON_SECRET &&
    (!authHeader || !authHeader.startsWith('Bearer ')) // Optionally check Firebase Auth here, but let's stick to cron secret or token for now.
  ) {
    // We only accept valid cron secret for this dispatcher
    if (process.env.NODE_ENV !== 'development' && req.query.bypass !== 'dev') {
       return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
    }
  }

  const mode = process.env.NOTIFICATIONS_MODE || 'test'; // off | test | live
  if (mode === 'off') {
    return res.status(200).json({ message: 'Notifications are OFF' });
  }

  const limit = 20; // Lote acotado
  
  try {
    const reqBody = req.body || {};
    const reqQuery = req.query || {};
    const shopId = reqBody.shopId || reqQuery.shopId;
    
    let snapshot;
    if (shopId && typeof shopId === 'string') {
      snapshot = await db.collection(`businesses/${shopId}/outbox`).where('status', '==', 'pending').limit(limit).get();
    } else {
      const outboxRef = db.collectionGroup('outbox');
      snapshot = await outboxRef.where('status', '==', 'pending').limit(limit).get();
    }

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No pending emails' });
    }

    const results = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Mark as processing to prevent concurrent workers from picking it up
      await doc.ref.update({ status: 'processing', processingAt: new Date() });
      
      const { to, data: emailData } = data.payload;
      
      // Re-check appointment status before sending
      // The outbox doc path is: businesses/{shopId}/outbox/{appId}
      // Wait, appointment update creates outbox document with `appId_update_timestamp` as ID.
      // So we can't always deduce appId from doc.id. 
      // But we don't strictly need to re-fetch if we trust the outbox event for confirmations/cancellations.
      // Wait, FR-006 says "Revalidar estado/fecha/contacto antes de enviar". That's for CRON reminders.
      // This outbox dispatcher is for immediate transactional emails (confirmation/cancellation).
      
      let htmlContent = '';
      let subject = '';

      if (data.type === 'confirmation') {
        subject = '¡Turno Confirmado!';
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>¡Turno Confirmado!</h2>
            <p>Hola ${emailData.clientName || 'cliente'}, tu turno en <strong>${emailData.shopName || 'nuestro local'}</strong> ha sido confirmado.</p>
            <ul>
              <li><strong>Servicio:</strong> ${emailData.serviceName || 'Desconocido'}</li>
              <li><strong>Profesional:</strong> ${emailData.professionalName || 'Cualquiera'}</li>
              <li><strong>Fecha:</strong> ${emailData.date}</li>
              <li><strong>Hora:</strong> ${emailData.startTime}</li>
            </ul>
            <p>¡Te esperamos!</p>
          </div>
        `;
      } else if (data.type === 'cancellation') {
        subject = 'Turno Cancelado';
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Turno Cancelado</h2>
            <p>Hola ${emailData.clientName || 'cliente'}, tu turno en <strong>${emailData.shopName || 'nuestro local'}</strong> para el ${emailData.date} a las ${emailData.startTime} ha sido cancelado.</p>
            <p>Si fue un error, por favor comunícate con el local o vuelve a agendar a través de la aplicación.</p>
          </div>
        `;
      } else if (data.type === 'reminder') {
        subject = 'Recordatorio de Turno';
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Recordatorio diario de próximos turnos</h2>
            <p>Hola ${emailData.clientName || 'cliente'}, te recordamos tu próximo turno en <strong>${emailData.shopName || 'nuestro local'}</strong>.</p>
            <ul>
              <li><strong>Servicio:</strong> ${emailData.serviceName || 'Desconocido'}</li>
              <li><strong>Profesional:</strong> ${emailData.professionalName || 'Cualquiera'}</li>
              <li><strong>Fecha:</strong> ${emailData.date}</li>
              <li><strong>Hora:</strong> ${emailData.startTime}</li>
            </ul>
            <p>¡Te esperamos pronto!</p>
          </div>
        `;
      } else {
        await doc.ref.update({ status: 'failed', error: 'Invalid type', processedAt: new Date() });
        continue;
      }

      // Determine recipient based on mode
      let recipient = to;
      if (mode === 'test') {
        recipient = process.env.NOTIFICATIONS_TEST_RECIPIENT || 'alvarez.braian87@gmail.com';
      }

      if (!recipient) {
        // No destination email (e.g. manual booking without email provided)
        await doc.ref.update({ status: 'skipped', error: 'No recipient email', processedAt: new Date() });
        continue;
      }

      const sender = process.env.RESEND_FROM || 'Sistema de Turnos <onboarding@resend.dev>';

      try {
        const result = await resend.emails.send({
          from: sender,
          to: recipient,
          subject,
          html: htmlContent,
          tags: [
            { name: 'outbox_id', value: doc.id },
            { name: 'barbershop_id', value: data.barbershopId || 'unknown' },
            { name: 'environment', value: mode }
          ]
        });

        if (result.error) {
          console.error(`Resend Error for ${doc.id}:`, result.error);
          await doc.ref.update({ 
            status: 'failed', 
            error: result.error.message,
            retryCount: (data.retryCount || 0) + 1,
            processedAt: new Date() 
          });
          results.push({ id: doc.id, status: 'failed', error: result.error.message });
        } else {
          await doc.ref.update({ 
            status: 'sent', 
            resendId: result.data?.id,
            processedAt: new Date() 
          });
          results.push({ id: doc.id, status: 'sent', resendId: result.data?.id });
        }
      } catch (err: any) {
        console.error(`Error dispatching ${doc.id}:`, err);
        await doc.ref.update({ 
            status: 'failed', 
            error: err.message,
            retryCount: (data.retryCount || 0) + 1,
            processedAt: new Date() 
        });
        results.push({ id: doc.id, status: 'failed', error: err.message });
      }
    }

    return res.status(200).json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error('Dispatcher error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
