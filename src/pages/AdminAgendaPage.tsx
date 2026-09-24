import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAvailableSlots } from '../utils/availability';
import type { Professional, Appointment } from '../utils/availability';
import { Plus, X, User, Phone, Scissors, Calendar, Clock, AlertCircle, Check, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { appointmentApi } from '../services/api';

interface Service {
  id: string;
  name: string;
  duration: number;
}

const AdminAgendaPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const shopId = user?.barbershopId;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProId, setSelectedProId] = useState<string>('all');

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsLoading(true);

    const unsubs: (() => void)[] = [];

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
      setIsLoading(false);
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
    
    const [y, m, d] = date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    const proApps = appointments.filter(a => a.professionalId === pro.id && a.date === date);

    return getAvailableSlots(targetDate, pro, proApps, Number(srv.duration), 30);
  }, [newApp.professionalId, newApp.serviceId, date, professionals, services, appointments]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !newApp.professionalId || !newApp.serviceId || !newApp.startTime) return;

    const srv = services.find(s => s.id === newApp.serviceId);
    if (!srv) return;

    setIsSubmitting(true);

    try {
      await appointmentApi.create({
        barbershopId: shopId,
        professionalId: newApp.professionalId,
        serviceId: newApp.serviceId,
        date: date,
        startTime: newApp.startTime,
        manualContact: { name: newApp.clientName, phone: newApp.clientPhone },
      });

      setIsModalOpen(false);
      setNewApp({ professionalId: '', serviceId: '', clientName: '', clientPhone: '', startTime: '' });
      success('Turno creado exitosamente');
    } catch (err) {
      console.error(err);
      showError(getAppError(err), 'Error creando turno');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proMap = useMemo(() => Object.fromEntries(professionals.map(p => [p.id, p.name])), [professionals]);
  const srvMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s.name])), [services]);

  return (
    <Layout title="Agenda Global">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header & Controls */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-2">Agenda Global</h1>
              <p className="text-text-secondary text-lg">Panel de administración general de reservas.</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-on-primary font-bold shadow-glow hover:bg-accent-hover transition-colors w-full lg:w-auto"
            >
              <Plus size={20} />
              Añadir Turno Manual
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-2xl border border-glass-border">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                <Calendar size={16} /> Fecha
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-semibold focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                <User size={16} /> Filtrar Profesional
              </label>
              <div className="relative">
                <select 
                  value={selectedProId} 
                  onChange={e => setSelectedProId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-semibold appearance-none focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                >
                  <option value="all">Todos los barberos</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div className="flex items-end sm:w-32">
              <div className="w-full h-[46px] flex flex-col items-center justify-center bg-accent/10 rounded-xl text-accent border border-accent/20">
                <span className="text-xl font-black leading-none">{displayedApps.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Turnos</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Agenda View */}
        <section className="bg-surface border border-glass-border rounded-3xl p-4 sm:p-8 shadow-sm min-h-[500px]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 w-full bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : displayedApps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center h-64 sm:h-96"
            >
              <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-6">
                <Calendar size={36} />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Agenda Vacía</h3>
              <p className="text-text-secondary max-w-md">No hay turnos agendados para esta fecha con el filtro actual.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayedApps.map(app => {
                  const isPending = app.status === 'pending';
                  const isCompleted = app.status === 'completed';
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      key={app.id} 
                      className={cn(
                        "relative flex flex-col md:flex-row gap-4 md:gap-6 p-5 bg-background rounded-2xl border border-glass-border transition-all overflow-hidden group",
                        isPending ? "hover:border-accent/30 hover:shadow-sm" : "opacity-80"
                      )}
                    >
                      {/* Timeline Accent Bar */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5",
                        isPending ? "bg-accent" : 
                        isCompleted ? "bg-success" : "bg-danger"
                      )} />

                      {/* Time Info */}
                      <div className="flex md:flex-col justify-between md:justify-center items-center md:items-start min-w-[100px] border-b md:border-b-0 md:border-r border-glass-border pb-3 md:pb-0 md:pr-6">
                        <div className="font-heading text-3xl font-black text-foreground">{app.startTime}</div>
                        <div className="text-sm font-semibold text-text-muted flex items-center gap-1">
                          <Clock size={14} /> {app.endTime}
                        </div>
                        <div className="md:hidden mt-2">
                          <StatusBadge status={app.status} />
                        </div>
                      </div>
                      
                      {/* Client & Pro Info */}
                      <div className="flex-1 py-1 md:py-0">
                        <h3 className="font-bold text-xl text-foreground truncate mb-2">
                          {app.clientName || 'Cliente sin nombre'}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm font-medium text-text-secondary">
                          <span className="flex items-center gap-2">
                            <Scissors size={16} className="text-accent"/> 
                            {srvMap[app.serviceId] || 'Desconocido'}
                          </span>
                          <span className="flex items-center gap-2">
                            <User size={16} className="text-accent"/> 
                            {proMap[app.professionalId] || 'Desconocido'}
                          </span>
                          {app.clientPhone && (
                            <span className="flex items-center gap-2">
                              <Phone size={16} className="text-text-muted"/> 
                              {app.clientPhone}
                              <a
                                href={buildWhatsAppUrl(app.clientPhone, app.clientName)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Contactar a ${app.clientName} por WhatsApp`}
                                className="ml-2 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </a>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Desktop Status */}
                      <div className="hidden md:flex flex-col items-end justify-center pl-4">
                        <StatusBadge status={app.status} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* Manual Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-background border border-glass-border rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-glass-border bg-surface">
                <h3 className="font-heading text-xl font-bold text-foreground">Añadir Turno Manual</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-text-muted transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>
              
              <form onSubmit={handleCreateAppointment} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Profesional</label>
                    <select 
                      required 
                      value={newApp.professionalId} 
                      onChange={e => setNewApp({...newApp, professionalId: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    >
                      <option value="">Seleccione...</option>
                      {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Servicio</label>
                    <select 
                      required 
                      value={newApp.serviceId} 
                      onChange={e => setNewApp({...newApp, serviceId: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    >
                      <option value="">Seleccione...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Horario en fecha: {date}</label>
                  {newApp.professionalId && newApp.serviceId ? (
                    availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {availableSlots.map(slot => (
                          <button 
                            type="button"
                            key={slot} 
                            onClick={() => setNewApp({...newApp, startTime: slot})}
                            className={cn(
                              "text-center py-2 rounded-lg text-sm font-bold cursor-pointer transition-all border",
                              newApp.startTime === slot 
                                ? "bg-accent border-accent text-on-primary shadow-glow scale-105" 
                                : "bg-surface border-glass-border text-foreground hover:border-accent/50 hover:bg-accent/10"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-danger/10 text-danger rounded-xl text-sm font-medium flex items-center gap-2">
                        <AlertCircle size={18} /> No hay horarios disponibles.
                      </div>
                    )
                  ) : (
                    <div className="p-4 bg-secondary/50 text-text-muted rounded-xl text-sm border border-dashed border-glass-border">
                      Seleccione profesional y servicio para ver horarios.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Nombre Cliente</label>
                    <input 
                      required 
                      type="text" 
                      value={newApp.clientName} 
                      onChange={e => setNewApp({...newApp, clientName: e.target.value})} 
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Teléfono (Opcional)</label>
                    <input 
                      type="text" 
                      value={newApp.clientPhone} 
                      onChange={e => setNewApp({...newApp, clientPhone: e.target.value})} 
                      placeholder="Ej. 11 2345 6789"
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-glass-border mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-foreground bg-surface border border-glass-border hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newApp.startTime || isSubmitting} 
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-on-primary bg-accent shadow-glow hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <span className="animate-spin text-xl leading-none">◌</span> : <Check size={18} />}
                    {isSubmitting ? 'Guardando...' : 'Agendar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'pending':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-accent/10 text-accent"><AlertCircle size={14} /> Pendiente</span>;
    case 'completed':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-success/10 text-success"><Check size={14} /> Listo</span>;
    case 'absent':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-danger/10 text-danger"><X size={14} /> Ausente</span>;
    case 'cancelled':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-danger/10 text-danger"><X size={14} /> Cancelado</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-secondary text-text-muted">{status}</span>;
  }
};

export default AdminAgendaPage;
