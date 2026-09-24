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
    const { barbershopId, appointmentId, status } = req.body;

    if (!barbershopId || !appointmentId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const shopRef = db.collection('businesses').doc(barbershopId);
    const appointmentRef = shopRef.collection('appointments').doc(appointmentId);
    const availabilityRef = shopRef.collection('availability').doc(appointmentId);
    const outboxRef = shopRef.collection('outbox').doc(`${appointmentId}_update_${Date.now()}`);

    // Auth check: Is user authorized?
    // We fetch user role
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    await db.runTransaction(async (transaction) => {
      const appSnap = await transaction.get(appointmentRef);
      if (!appSnap.exists) {
        throw new Error('NOT_FOUND');
      }
      
      const appData = appSnap.data()!;

      // Authorization logic
      const isClientOwner = appData.clientId === decodedToken.uid;
      const isAdmin = userData?.role === 'admin' && userData?.barbershopId === barbershopId;
      const isSuperAdmin = userData?.role === 'super-admin';
      const isProfessional = userData?.role === 'professional' && userData?.barbershopId === barbershopId;

      if (!isClientOwner && !isAdmin && !isSuperAdmin && !isProfessional) {
        throw new Error('UNAUTHORIZED');
      }

      // If client, they can only cancel
      if (isClientOwner && status !== 'cancelled' && !isAdmin && !isSuperAdmin && !isProfessional) {
         throw new Error('UNAUTHORIZED_ACTION');
      }

      transaction.update(appointmentRef, { status });
      transaction.update(availabilityRef, { status });

      // If cancelled, queue an email
      if (status === 'cancelled' && appData.clientEmail) {
        transaction.set(outboxRef, {
          barbershopId,
          type: 'cancellation',
          status: 'pending',
          payload: {
            to: appData.clientEmail,
            data: {
              clientName: appData.clientName,
              shopName: appData.shopName,
              date: appData.date,
              startTime: appData.startTime
            }
          },
          createdAt: new Date(),
          retryCount: 0
        });
      }
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Appointment not found' });
    if (error.message === 'UNAUTHORIZED' || error.message === 'UNAUTHORIZED_ACTION') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
