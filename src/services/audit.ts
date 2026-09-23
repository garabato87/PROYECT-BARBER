import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import type { AuditAction, AuditLog } from '../types';

export const logAuditActivity = async (
  action: AuditAction,
  target: AuditLog['target'],
  details?: AuditLog['details']
) => {
  try {
    const user = auth.currentUser;
    let role = 'none';
    let actor = { userId: 'UNAUTHENTICATED', email: 'none', role: 'none' };

    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      role = userDoc.exists() ? userDoc.data().role : 'unknown';
      actor = { userId: user.uid, email: user.email || 'unknown@mail.com', role };
    } else {
      console.warn('Audit Logger: Logging unauthenticated action.');
    }

    const auditData: Omit<AuditLog, 'id' | 'timestamp'> = {
      actor,
      action,
      target,
      details: details || {},
    };

    await addDoc(collection(db, 'audit_logs'), {
      ...auditData,
      timestamp: serverTimestamp(),
    });

  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
};
