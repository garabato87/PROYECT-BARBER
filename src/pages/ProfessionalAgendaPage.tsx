/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAvailableSlots, type Professional, type Appointment } from '../utils/availability';
import { Phone, Scissors, Check, X as XIcon, Calendar, Clock, AlertCircle, Plus, Loader2, History, Filter, MessageCircle } from 'lucide-react';
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

type TabType = 'agenda' | 'history';

const ProfessionalAgendaPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const shopId = user?.barbershopId;
  const proId = user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyMonth, setHistoryMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: date,
    time: ''
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!shopId || !proId) return;
    setIsLoading(true);
    
    const unsubs: (() => void)[] = [];

    // Fetch professional data
    const fetchPro = async () => {
      try {
        const proSnap = await getDoc(doc(db, 'businesses', shopId, 'professionals', proId));
        if (proSnap.exists()) {
          setProfessional({ id: proSnap.id, ...proSnap.data() } as Professional);
        }
      } catch (err) {
        console.error("Error fetching professional data", err);
      }
    };
    fetchPro();

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
      setIsLoading(false);
    }));

    return () => unsubs.forEach(fn => fn());
  }, [shopId, proId]);

  // Calculate slots when booking data changes
  useEffect(() => {
    if (!professional || !newBooking.serviceId || !newBooking.date) {
      setAvailableSlots([]);
      return;
    }
    const selectedSrv = services.find(s => s.id === newBooking.serviceId);
    if (!selectedSrv) return;

    const targetDate = new Date(newBooking.date + 'T00:00:00');
    // Ensure we don't calculate slots in the past if it's today
    const slots = getAvailableSlots(
      targetDate,
      professional,
      appointments,
      selectedSrv.duration
    );
    setAvailableSlots(slots);
    
    // Reset selected time if it's no longer available
    if (newBooking.time && !slots.includes(newBooking.time)) {
      setNewBooking(prev => ({ ...prev, time: '' }));
    }
  }, [newBooking.date, newBooking.serviceId, professional, appointments, services]);

  const displayedApps = useMemo(() => {
    return appointments
      .filter(app => app.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, date]);

  const historyApps = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(app => {
        // Filter by month
        if (!app.date.startsWith(historyMonth)) return false;
        
        // Show if explicitly completed/cancelled/absent OR if it's a past date
        if (['completed', 'cancelled', 'absent'].includes(app.status)) return true;
        if (app.date < today) return true;
        return false;
      })
      .sort((a, b) => {
        // Sort descending (newest first)
        const dateA = `${a.date}T${a.startTime}`;
        const dateB = `${b.date}T${b.startTime}`;
        return dateB.localeCompare(dateA);
      });
  }, [appointments, historyMonth]);

  const updateStatus = async (appId: string, newStatus: 'completed' | 'absent') => {
    if (!shopId) return;
    try {
      await appointmentApi.update(shopId, appId, newStatus);
      success(`Turno marcado como ${newStatus === 'completed' ? 'completado' : 'ausente'}`);
    } catch (error) {
      console.error("Error actualizando turno:", error);
      showError(getAppError(error));
    }
  };

  const getSrvName = (id: string) => services.find(s => s.id === id)?.name || 'Desconocido';

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !professional?.id || !newBooking.serviceId || !newBooking.time || isBooking) return;
    
    setIsBooking(true);
    try {
      const selectedSrv = services.find(s => s.id === newBooking.serviceId);
      if (!selectedSrv) throw new Error("Servicio no encontrado");

      await appointmentApi.create({
        barbershopId: shopId,
        professionalId: professional.id,
        serviceId: selectedSrv.id,
        date: newBooking.date,
        startTime: newBooking.time,
        manualContact: {
          name: newBooking.clientName.trim() || 'Cliente sin nombre',
          phone: newBooking.clientPhone.trim(),
        },
      });

      success("Turno creado exitosamente");
      setIsModalOpen(false);
      setNewBooking(prev => ({ ...prev, clientName: '', clientPhone: '', time: '' }));
      setDate(newBooking.date);
      setActiveTab('agenda');
    } catch (error: any) {
      console.error("Error booking:", error);
      if (error.message === 'SLOT_TAKEN') {
        showError("El horario ya fue ocupado. Por favor, selecciona otro.");
      } else {
        showError("Error al crear el turno. Revisa tu conexión.");
      }
    } finally {
      setIsBooking(false);
    }
  };

  const renderAppointmentCard = (app: Appointment, isHistory: boolean = false) => {
    const isPending = app.status === 'pending';
    const isConfirmed = app.status === 'confirmed';
    const isCompleted = app.status === 'completed';
    
    // Check if it's a past unhandled appointment
    const today = new Date().toISOString().split('T')[0];
    const isPastUnhandled = (isPending || isConfirmed) && app.date < today;

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        key={app.id} 
        className={cn(
          "relative flex flex-col p-4 sm:p-6 bg-background rounded-2xl border border-glass-border transition-all overflow-hidden group",
          (!isHistory && (isPending || isConfirmed)) ? "hover:border-accent/40 hover:shadow-md" : "opacity-80"
        )}
      >
        {/* Timeline Accent Bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          (isPending || isConfirmed) && !isPastUnhandled ? "bg-accent" : 
          isCompleted ? "bg-success" : 
          "bg-danger"
        )} />

        {/* Main Content Row */}
        <div className="flex flex-row gap-3 sm:gap-4 pl-1 sm:pl-0">
          
          {/* Left Column: Time & Date */}
          <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] border-r border-glass-border pr-3 sm:pr-4">
            {isHistory && (
              <span className="text-[10px] sm:text-xs font-bold text-text-muted mb-1 text-center w-full block">
                {app.date.split('-').reverse().join('/')}
              </span>
            )}
            <span className="font-heading text-2xl sm:text-3xl font-black text-foreground leading-none tracking-tight">
              {app.startTime}
            </span>
            <span className="text-[11px] sm:text-sm font-semibold text-text-muted mt-1.5 flex items-center gap-1">
              <Clock size={12} className="sm:hidden"/> 
              <Clock size={14} className="hidden sm:block"/> 
              {app.endTime}
            </span>
          </div>

          {/* Center Column: Client & Service */}
          <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg sm:text-xl text-foreground truncate pr-2">
                {app.clientName || 'Cliente sin nombre'}
              </h3>
              {/* Mobile Status Badge */}
              <div className="shrink-0 sm:hidden">
                <StatusBadge status={isPastUnhandled ? 'absent' : app.status} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-text-secondary">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-foreground">
                <Scissors size={14} className="text-accent"/> 
                <span className="truncate max-w-[110px] sm:max-w-[200px]">{getSrvName(app.serviceId)}</span>
              </span>
              {app.clientPhone && (
                <span className="flex items-center gap-1.5 mt-1 sm:mt-0">
                  <Phone size={14} className="text-text-muted"/> 
                  {app.clientPhone}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Desktop Status Badge */}
          <div className="hidden sm:flex flex-col items-end justify-start pl-2">
            <StatusBadge status={isPastUnhandled ? 'absent' : app.status} />
          </div>
        </div>

        {/* Action Buttons (Bottom Row) */}
        {!isHistory && (isPending || isConfirmed) && !isPastUnhandled && (
          <div className="flex gap-2 sm:gap-4 mt-4 pt-4 border-t border-glass-border pl-1 sm:pl-0">
            {app.clientPhone && (
              <a 
                href={buildWhatsAppUrl(app.clientPhone, app.clientName)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contactar a ${app.clientName} por WhatsApp`}
                className="flex-1 sm:flex-none sm:px-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
              >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button 
              onClick={() => updateStatus(app.id!, 'completed')}
              aria-label="Completar turno"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold bg-success/10 text-success hover:bg-success hover:text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
            >
              <Check size={18} />
              <span className="hidden sm:inline">Completar</span>
            </button>
            <button 
              onClick={() => updateStatus(app.id!, 'absent')}
              aria-label="Marcar como ausente"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
            >
              <XIcon size={18} />
              <span className="hidden sm:inline">Ausente</span>
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Layout title="Mi Agenda">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8"
        >
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-2">Mi Agenda</h1>
            <p className="text-text-secondary text-lg">Gestioná tus citas y organizá tu día.</p>
          </div>
          
          <div className="flex w-full sm:w-auto">
            <button
              onClick={() => {
                setNewBooking(prev => ({ ...prev, date: date }));
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-foreground text-background hover:bg-text-secondary transition-colors"
            >
              <Plus size={20} />
              Nuevo Turno
            </button>
          </div>
        </motion.header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-glass-border pb-1">
          <button
            onClick={() => setActiveTab('agenda')}
            className={cn(
              "px-5 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-2",
              activeTab === 'agenda' 
                ? "bg-surface border-x border-t border-glass-border text-accent relative top-[1px]" 
                : "text-text-secondary hover:text-foreground"
            )}
          >
            <Calendar size={18} /> Agenda del Día
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-5 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-2",
              activeTab === 'history' 
                ? "bg-surface border-x border-t border-glass-border text-accent relative top-[1px]" 
                : "text-text-secondary hover:text-foreground"
            )}
          >
            <History size={18} /> Historial
          </button>
        </div>

        {/* Filters Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'agenda' ? (
            <motion.div 
              key="agenda-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-6"
            >
              <div className="flex-1 w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                  <Calendar size={16} />
                  Día Seleccionado
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-surface border border-glass-border rounded-xl text-foreground font-semibold focus:outline-none focus:border-accent/50 shadow-sm transition-colors cursor-pointer"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-accent text-on-primary px-6 py-2 rounded-xl shadow-glow">
                <span className="text-xl font-black leading-none mb-1">{displayedApps.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Turnos Hoy</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-6"
            >
              <div className="flex-1 w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                  <Filter size={16} />
                  Mes
                </label>
                <input 
                  type="month" 
                  value={historyMonth} 
                  onChange={e => setHistoryMonth(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-surface border border-glass-border rounded-xl text-foreground font-semibold focus:outline-none focus:border-accent/50 shadow-sm transition-colors cursor-pointer"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-surface border border-glass-border text-foreground px-6 py-2 rounded-xl">
                <span className="text-xl font-black leading-none mb-1 text-accent">{historyApps.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">En el mes</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Section */}
        <section className="bg-surface border border-glass-border rounded-3xl p-4 sm:p-8 shadow-sm min-h-[500px]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 w-full bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'agenda' ? (
                displayedApps.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center h-64 sm:h-96"
                  >
                    <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-6">
                      <Calendar size={36} />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Día Libre</h3>
                    <p className="text-text-secondary max-w-md">No tenés turnos agendados para este día. ¡Disfrutá tu tiempo libre!</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {displayedApps.map(app => renderAppointmentCard(app, false))}
                  </AnimatePresence>
                )
              ) : (
                historyApps.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center h-64 sm:h-96"
                  >
                    <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-6">
                      <History size={36} />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Sin Historial</h3>
                    <p className="text-text-secondary max-w-md">No hay cortes registrados en este mes.</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {historyApps.map(app => renderAppointmentCard(app, true))}
                  </AnimatePresence>
                )
              )}
            </div>
          )}
        </section>

        {/* Modal Nuevo Turno Manual */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="relative w-full max-w-lg bg-surface border border-glass-border rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-glass-border flex justify-between items-center bg-background/50">
                  <h3 id="modal-title" className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                    <Calendar size={24} className="text-accent" />
                    Nuevo Turno Manual
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Cerrar modal"
                    className="p-2 hover:bg-secondary rounded-full transition-colors text-text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <XIcon size={20}/>
                  </button>
                </div>

                <form onSubmit={handleBook} className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                  
                  {/* Datos del Cliente */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground text-lg">Datos del Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={newBooking.clientName}
                          onChange={e => setNewBooking({...newBooking, clientName: e.target.value})}
                          placeholder="Ej: Juan Pérez"
                          className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Teléfono (Opcional)</label>
                        <input 
                          type="tel" 
                          value={newBooking.clientPhone}
                          onChange={e => setNewBooking({...newBooking, clientPhone: e.target.value})}
                          placeholder="+54 11 1234-5678"
                          className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-glass-border" />

                  {/* Detalle del Turno */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground text-lg">Detalle del Turno</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-secondary">Servicio</label>
                      <select 
                        value={newBooking.serviceId}
                        onChange={e => setNewBooking({...newBooking, serviceId: e.target.value})}
                        className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background appearance-none"
                        required
                      >
                        <option value="">Selecciona un servicio...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Fecha</label>
                        <input 
                          type="date" 
                          value={newBooking.date}
                          onChange={e => setNewBooking({...newBooking, date: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Horario</label>
                        <select 
                          value={newBooking.time}
                          onChange={e => setNewBooking({...newBooking, time: e.target.value})}
                          className="w-full px-4 py-2.5 bg-background border border-glass-border rounded-xl text-foreground font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background appearance-none"
                          required
                          disabled={!newBooking.serviceId || availableSlots.length === 0}
                        >
                          <option value="">
                            {!newBooking.serviceId 
                              ? 'Elige servicio primero' 
                              : availableSlots.length === 0 
                                ? 'Sin turnos disponibles' 
                                : 'Seleccionar horario'}
                          </option>
                          {availableSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-glass-border flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-foreground hover:bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isBooking || !newBooking.time}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-accent text-on-primary hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      {isBooking ? <Loader2 size={20} className="animate-spin"/> : <Check size={20}/>}
                      {isBooking ? 'Agendando...' : 'Confirmar Turno'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

// Helper Component for Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'pending':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-accent/10 text-accent"><AlertCircle size={14} /> Pendiente</span>;
    case 'confirmed':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-success/10 text-success"><Check size={14} /> Confirmado</span>;
    case 'completed':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-success/10 text-success"><Check size={14} /> Completado</span>;
    case 'absent':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-danger/10 text-danger"><XIcon size={14} /> Ausente</span>;
    case 'cancelled':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-danger/10 text-danger"><XIcon size={14} /> Cancelado</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-secondary text-text-muted">{status}</span>;
  }
};

export default ProfessionalAgendaPage;
