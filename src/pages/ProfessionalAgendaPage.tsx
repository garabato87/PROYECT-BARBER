import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { Appointment } from '../utils/availability';
import { Phone, Clock, Calendar as CalendarIcon, Scissors, Check, X as XIcon } from 'lucide-react';
import './ProfessionalAgenda.css';

interface Service {
  id: string;
  name: string;
  duration: number;
}

const ProfessionalAgendaPage: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId;
  const proId = user?.id;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!shopId || !proId) return;
    const unsubs: any[] = [];

    // Services
    const srvQ = collection(db, 'businesses', shopId, 'services');
    unsubs.push(onSnapshot(srvQ, snap => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    }));

    // Appointments for this professional
    const appQ = query(
      collection(db, 'businesses', shopId, 'appointments'),
      where('barbershopId', '==', shopId),
      where('professionalId', '==', proId)
    );
    unsubs.push(onSnapshot(appQ, snap => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    }));

    return () => unsubs.forEach(fn => fn());
  }, [shopId, proId]);

  const displayedApps = useMemo(() => {
    return appointments
      .filter(a => a.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, date]);

  const updateStatus = async (appId: string, newStatus: string) => {
    if (!shopId) return;
    try {
      await updateDoc(doc(db, 'businesses', shopId, 'appointments', appId), {
        status: newStatus
      });
    } catch (err) {
      console.error(err);
      alert('Error al actualizar estado');
    }
  };

  const getSrvName = (id: string) => services.find(s => s.id === id)?.name || 'Desconocido';

  return (
    <Layout title="Mi Agenda">
      <div className="agenda-container animate-slide-up">
        <header className="agenda-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Mis Turnos</h1>
            <p className="text-muted">Gestiona tus citas para el día</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
             <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Fecha</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
              />
            </div>
            <div className="stat-card" style={{ background: 'var(--accent)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="value" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{displayedApps.length}</span>
              <span className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Turnos</span>
            </div>
          </div>
        </header>

        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border)' }}>
          {displayedApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No tienes turnos agendados para este día.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedApps.map(app => (
                <div key={app.id} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--accent)', alignItems: 'center' }}>
                  <div style={{ minWidth: '100px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{app.startTime}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{app.endTime}</div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{app.clientName || 'Cliente sin nombre'}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Scissors size={14}/> {getSrvName(app.serviceId)}</span>
                      {app.clientPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14}/> {app.clientPhone}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                      background: app.status === 'pending' ? '#fff3bf' : (app.status === 'completed' ? '#d3f9d8' : '#ffe3e3'),
                      color: app.status === 'pending' ? '#e67700' : (app.status === 'completed' ? '#2b8a3e' : '#c92a2a')
                    }}>
                      {app.status === 'pending' ? 'Pendiente' : (app.status === 'completed' ? 'Completado' : app.status)}
                    </span>
                    
                    {app.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => updateStatus(app.id!, 'completed')}
                          title="Marcar como Completado"
                          style={{ padding: '0.5rem', borderRadius: '50%', background: '#d3f9d8', color: '#2b8a3e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => updateStatus(app.id!, 'absent')}
                          title="Marcar como Ausente"
                          style={{ padding: '0.5rem', borderRadius: '50%', background: '#ffe3e3', color: '#c92a2a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalAgendaPage;
