import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    try {
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountStr) {
        const serviceAccount = JSON.parse(serviceAccountStr);
        return initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        // Inicialización por defecto en caso de estar en un entorno donde se inyectan las credenciales
        return initializeApp();
      }
    } catch (error) {
      console.error('Error inicializando Firebase Admin:', error);
      // Fallback
      return initializeApp();
    }
  }
  return getApps()[0];
}

// Inicializar la app
const app = getFirebaseAdminApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
