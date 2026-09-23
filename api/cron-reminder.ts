import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin safely
if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT.', error);
  }
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Verify cron secret for security (Vercel automatically sets CRON_SECRET)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Si no hay admin inicializado (ej: falta de variable de entorno), no podemos consultar
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT.' });
  }

  const db = admin.firestore();

  try {
    const now = new Date();
    
    // Obtenemos todos los negocios
    const businessesSnap = await db.collection('businesses').get();
    
    let remindersSent = 0;

    for (const shopDoc of businessesSnap.docs) {
      const shopId = shopDoc.id;
      
      // Buscamos turnos pendientes o confirmados
      const appsSnap = await db.collection(`businesses/${shopId}/appointments`)
        .where('status', 'in', ['pending', 'confirmed'])
        .get();

      for (const appDoc of appsSnap.docs) {
        const app = appDoc.data();
        
        if (app.reminderSent) continue;
        if (!app.date || !app.startTime) continue;
        if (!app.clientEmail) continue;

        // Formato date: "2024-05-10", startTime: "14:30"
        const [year, month, day] = app.date.split('-').map(Number);
        const [hour, min] = app.startTime.split(':').map(Number);
        
        // Asumiendo que el local está en Argentina (UTC-3), creamos un Date UTC exacto
        const appDateUTC = new Date(Date.UTC(year, month - 1, day, hour + 3, min));
        
        // Diferencia en horas entre el turno y AHORA
        const diffMs = appDateUTC.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Si falta entre 0 y 36 horas para el turno, enviamos el mail
        // (Como Vercel gratuito solo nos deja correr el cron 1 vez al día, escaneamos todo lo de "mañana")
        if (diffHours > 0 && diffHours <= 36) {
          
          const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Recordatorio de Turno</h2>
              <p>Hola ${app.clientName || 'cliente'}, te recordamos que tenés un turno en <strong>${app.shopName || 'nuestro local'}</strong> en las próximas horas.</p>
              <ul>
                <li><strong>Fecha:</strong> ${app.date}</li>
                <li><strong>Hora:</strong> ${app.startTime}</li>
              </ul>
              <p>¡Te esperamos!</p>
            </div>
          `;

          // En beta mandamos todo al mail de prueba
          const recipient = 'alvarez.braian87@gmail.com'; 

          try {
            await resend.emails.send({
              from: 'Sistema de Turnos <onboarding@resend.dev>',
              to: recipient,
              subject: 'Recordatorio de Turno',
              html: htmlContent,
            });

            // Marcamos como enviado para no repetir
            await appDoc.ref.update({ reminderSent: true });
            remindersSent++;
          } catch (e) {
            console.error(`Error enviando reminder para turno ${appDoc.id}`, e);
          }
        }
      }
    }

    return res.status(200).json({ success: true, remindersSent });
  } catch (error) {
    console.error('Error in cron job:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
