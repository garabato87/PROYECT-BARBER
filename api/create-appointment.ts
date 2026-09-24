import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth } from './_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Require Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }

  try {
    const { 
      barbershopId, 
      professionalId, 
      serviceId, 
      date, 
      startTime, 
      endTime, 
      clientName, 
      clientPhone, 
      clientEmail,
      shopName,
      serviceName,
      professionalName
    } = req.body;

    if (!barbershopId || !professionalId || !date || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appId = `${professionalId}_${date}_${startTime.replace(':', '')}`;
    const shopRef = db.collection('businesses').doc(barbershopId);
    const appointmentRef = shopRef.collection('appointments').doc(appId);
    const availabilityRef = shopRef.collection('availability').doc(appId);
    const outboxRef = shopRef.collection('outbox').doc(appId);

    await db.runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(appointmentRef);
      if (docSnapshot.exists) {
        throw new Error('SLOT_TAKEN');
      }

      // 1. Create Appointment
      transaction.set(appointmentRef, {
        barbershopId,
        professionalId,
        serviceId,
        clientId: decodedToken.uid, // Authentic identity
        clientName: clientName || '',
        clientPhone: clientPhone || '',
        clientEmail: clientEmail || decodedToken.email || '',
        shopName,
        serviceName,
        professionalName,
        date,
        startTime,
        endTime,
        status: 'pending',
        createdAt: new Date()
      });

      // 2. Create Availability Projection
      transaction.set(availabilityRef, {
        professionalId,
        date,
        startTime,
        endTime,
        status: 'pending'
      });

      // 3. Create Outbox Event for Email Dispatcher (Atomic)
      transaction.set(outboxRef, {
        barbershopId,
        type: 'confirmation',
        status: 'pending', // pending | processing | sent | failed
        payload: {
          to: clientEmail || decodedToken.email || '',
          data: {
            clientName,
            shopName,
            serviceName,
            professionalName,
            date,
            startTime
          }
        },
        createdAt: new Date(),
        retryCount: 0
      });
    });

    return res.status(200).json({ success: true, id: appId });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    if (error.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: 'Conflict: Slot already taken' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
