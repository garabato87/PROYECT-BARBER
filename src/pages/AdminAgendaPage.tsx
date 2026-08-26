import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { getAvailableSlots } from '../utils/availability';
import type { Professional, Appointment } from '../utils/availability';
import { Plus, X, User, Phone, Clock, Calendar as CalendarIcon, Scissors } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
}

const AdminAgendaPage: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProId, setSelectedProId] = useState<string>('all');

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    professionalId: '',
    serviceId: '',
    clientName: '',
    clientPhone: '',
    startTime: ''
  });

  // Fetch Data
  useEffect(() => {
    if (!shopId) return;

    const unsubs: any[] = [];

    // Pros
    const proQ = collection(db, 'businesses', shopId, 'professionals');
    unsubs.push(onSnapshot(proQ, snap => {
      setProfessionals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Professional)));
    }));

    // Services
    const srvQ = collection(db, 'businesses', shopId, 'services');
    unsubs.push(onSnapshot(srvQ, snap => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    }));

    // Appointments (listen to all for the shop)
    const appQ = query(
      collection(db, 'businesses', shopId, 'appointments'),
      where('barbershopId', '==', shopId)
    );
    unsubs.push(onSnapshot(appQ, snap => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    }));

    return () => unsubs.forEach(fn => fn());
  }, [shopId]);

  // Derived state
  const displayedApps = useMemo(() => {
    return appointments.filter(a => 
      a.date === date && 
      (selectedProId === 'all' || a.professionalId === selectedProId)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, date, selectedProId]);

  // Available slots for modal
  const availableSlots = useMemo(() => {
    if (!newApp.professionalId || !newApp.serviceId || !date) return [];
    const pro = professionals.find(p => p.id === newApp.professionalId);
    const srv = services.find(s => s.id === newApp.serviceId);
    if (!pro || !srv) return [];
    
    // Convert date string to Date object (local timezone)
    const [y, m, d] = date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);

    // Filter appointments for that pro on that date
    const proApps = appointments.filter(a => a.professionalId === pro.id && a.date === date);

    return getAvailableSlots(targetDate, pro, proApps, Number(srv.duration), 30);
  }, [newApp.professionalId, newApp.serviceId, date, professionals, services, appointments]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !newApp.professionalId || !newApp.serviceId || !newApp.startTime) return;

    const srv = services.find(s => s.id === newApp.serviceId);
    if (!srv) return;

    // Calculate end time
    const [hh, mm] = newApp.startTime.split(':').map(Number);
    const endTotalMins = hh * 60 + mm + Number(srv.duration);
    const endHH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
    const endMM = (endTotalMins % 60).toString().padStart(2, '0');
    const endTime = `${endHH}:${endMM}`;

    try {
      await addDoc(collection(db, 'businesses', shopId, 'appointments'), {
        barbershopId: shopId,
        professionalId: newApp.professionalId,
        serviceId: newApp.serviceId,
        clientName: newApp.clientName,
        clientPhone: newApp.clientPhone,
        date: date,
        startTime: newApp.startTime,
        endTime: endTime,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewApp({ professionalId: '', serviceId: '', clientName: '', clientPhone: '', startTime: '' });
    } catch (err) {
      console.error(err);
      alert('Error creando turno');
    }
  };

  const getProName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconocido';
  const getSrvName = (id: string) => services.find(s => s.id === id)?.name || 'Desconocido';

  return (
    <Layout title="Agenda Global">
      <div className="animate-slide-up">
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Fecha</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Barbero</label>
            <select 
              value={selectedProId} 
              onChange={e => setSelectedProId(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', minWidth: '150px' }}
            >
              <option value="all">Todos los barberos</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}></div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={18} />
            Añadir Turno Manual
          </button>
        </div>

        {/* Agenda View */}
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border)' }}>
          {displayedApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No hay turnos agendados para este día.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedApps.map(app => (
                <div key={app.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--accent)', alignItems: 'center' }}>
                  <div style={{ minWidth: '100px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{app.startTime}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{app.endTime}</div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{app.clientName || 'Cliente sin nombre'}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Scissors size={14}/> {getSrvName(app.serviceId)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> {getProName(app.professionalId)}</span>
                      {app.clientPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14}/> {app.clientPhone}</span>}
                    </div>
                  </div>

                  <div>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                      background: app.status === 'pending' ? '#fff3bf' : (app.status === 'completed' ? '#d3f9d8' : '#ffe3e3'),
                      color: app.status === 'pending' ? '#e67700' : (app.status === 'completed' ? '#2b8a3e' : '#c92a2a')
                    }}>
                      {app.status === 'pending' ? 'Pendiente' : (app.status === 'completed' ? 'Completado' : app.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Booking Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="animate-slide-up" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Nuevo Turno Manual</h3>
            
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Barbero</label>
                <select required value={newApp.professionalId} onChange={e => setNewApp({...newApp, professionalId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                  <option value="">Selecciona un barbero</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Servicio</label>
                <select required value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                  <option value="">Selecciona un servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Horario Disponible</label>
                {newApp.professionalId && newApp.serviceId ? (
                  availableSlots.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableSlots.map(slot => (
                        <div 
                          key={slot} 
                          onClick={() => setNewApp({...newApp, startTime: slot})}
                          style={{ 
                            padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                            background: newApp.startTime === slot ? 'var(--accent)' : 'var(--bg-primary)',
                            color: newApp.startTime === slot ? '#fff' : 'var(--text-primary)',
                            border: newApp.startTime === slot ? '1px solid var(--accent)' : '1px solid var(--border)'
                          }}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>No hay horarios disponibles para este barbero hoy.</div>
                  )
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Selecciona barbero y servicio primero.</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre del Cliente</label>
                  <input required type="text" value={newApp.clientName} onChange={e => setNewApp({...newApp, clientName: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="Juan Pérez" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Teléfono (Opcional)</label>
                  <input type="text" value={newApp.clientPhone} onChange={e => setNewApp({...newApp, clientPhone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="11 2345 6789" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={!newApp.startTime} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', background: newApp.startTime ? 'var(--accent)' : 'var(--bg-secondary)', color: newApp.startTime ? '#fff' : 'var(--text-muted)', border: 'none', cursor: newApp.startTime ? 'pointer' : 'not-allowed', fontWeight: 600 }}>Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminAgendaPage;
