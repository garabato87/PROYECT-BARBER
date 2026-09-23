import { useState, useEffect } from 'react';
import { collectionGroup, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface Appointment {
  id: string;
  ref: any;
  date: string;
  startTime: string;
  status: string;
  serviceName: string;
  shopName: string;
  professionalName: string;
  clientId?: string;
  barbershopId?: string;
}

export const useClientAppointments = (userId?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collectionGroup(db, 'appointments'),
      where('clientId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() } as Appointment));
      setAppointments(apps);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error fetching client appointments:', err);
      setError(err.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { appointments, isLoading, error };
};
