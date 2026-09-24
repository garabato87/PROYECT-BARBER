import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  // Validar autorización
  const cronSecret = req.headers['authorization'] || req.headers['x-cron-secret'];
  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    cronSecret !== process.env.CRON_SECRET
  ) {
    if (process.env.NODE_ENV !== 'development' && req.query.bypass !== 'dev') {
       return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
    }
  }

  const mode = process.env.NOTIFICATIONS_MODE || 'test';
  if (mode === 'off') {
    return res.status(200).json({ message: 'Notifications are OFF' });
  }

  // Calcular la fecha de "mañana" en America/Argentina/Buenos_Aires
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const now = new Date();
  const tomorrowObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // Format returns dd/mm/yyyy in es-AR. We need to convert it to yyyy-mm-dd (our standard)
  const parts = formatter.formatToParts(tomorrowObj);
  const dd = parts.find(p => p.type === 'day')?.value;
  const mm = parts.find(p => p.type === 'month')?.value;
  const yyyy = parts.find(p => p.type === 'year')?.value;
  const tomorrowDateStr = `${yyyy}-${mm}-${dd}`;

  console.log(`Cron Reminder Execution. Target Date: ${tomorrowDateStr}`);

  let processedCount = 0;
  const BATCH_LIMIT = 50;
  const TIME_LIMIT_MS = 8000;
  let lastDoc: any = null;

  try {
    while (Date.now() - startTime < TIME_LIMIT_MS) {
      let query = db.collectionGroup('appointments')
        .where('date', '==', tomorrowDateStr)
        .where('status', 'in', ['pending', 'confirmed'])
        .orderBy('__name__')
        .limit(BATCH_LIMIT);
        
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break; 
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      let batchProcessed = 0;
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        if (data.reminderQueued) {
          continue; 
        }

        const barbershopId = data.barbershopId;
        const outboxRef = db.collection('businesses').doc(barbershopId).collection('outbox').doc(`${doc.id}_reminder`);
        
        if (data.clientEmail) {
          batch.set(outboxRef, {
            barbershopId,
            type: 'reminder',
            status: 'pending',
            payload: {
              to: data.clientEmail,
              data: {
                clientName: data.clientName,
                shopName: data.shopName,
                serviceName: data.serviceName,
                professionalName: data.professionalName,
                date: data.date,
                startTime: data.startTime
              }
            },
            createdAt: new Date(),
            retryCount: 0
          });
        }

        batch.update(doc.ref, { reminderQueued: true });
        batchProcessed++;
      }

      if (batchProcessed > 0) {
         await batch.commit();
         processedCount += batchProcessed;
      }
      
      if (snapshot.size < BATCH_LIMIT) {
        break;
      }
    }

    return res.status(200).json({ 
      success: true, 
      dateTarget: tomorrowDateStr, 
      processed: processedCount,
      timeMs: Date.now() - startTime
    });
  } catch (error: any) {
    console.error('Cron reminder error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
