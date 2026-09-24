/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Clock, CalendarDays, User, Scissors, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getAvailableSlots, type Professional, type Appointment } from '../utils/availability';
import { useAuth } from '../hooks/useAuth';
import { appointmentApi } from '../services/api';
import { savePendingBooking, getPendingBooking, clearPendingBooking } from '../utils/bookingSession';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import ExploreLayout from '../components/ExploreLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const BarbershopDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { error: showError, info: showInfo } = useToast();
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [step, setStep] = useState(1); 
  const [booking, setBooking] = useState({
    service: null as any,
    professional: null as unknown as Professional,
    date: '',
    time: ''
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [shopSnap, srvSnap, proSnap] = await Promise.all([
          getDoc(doc(db, 'businesses', id)),
          getDocs(collection(db, 'businesses', id, 'services')),
          getDocs(query(collection(db, 'businesses', id, 'professionals'), where('isActive', '==', true)))
        ]);

        if (shopSnap.exists()) setShop({ id: shopSnap.id, ...shopSnap.data() });
        setServices(srvSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProfessionals(proSnap.docs.map(d => ({ id: d.id, ...d.data() } as Professional)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const pending = getPendingBooking();
    if (pending && pending.shopId === id) {
      setBooking({
        service: pending.service,
        professional: pending.professional,
        date: pending.date,
        time: pending.time
      });
      setStep(3);
    }
  }, [id]);

  useEffect(() => {
    if (step === 3 && booking.professional && booking.date && id) {
      const checkAvailability = async () => {
        setIsCheckingSlots(true);
        try {
          const appQ = query(
            collection(db, 'businesses', id, 'availability'),
            where('professionalId', '==', booking.professional.id),
            where('date', '==', booking.date)
          );
          const snap = await getDocs(appQ);
          const apps = snap.docs.map(d => d.data() as Appointment);
          
          const [year, month, day] = booking.date.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          
          const slots = getAvailableSlots(d, booking.professional, apps, booking.service?.duration || 30);
          setAvailableSlots(slots);
          
          if (booking.time && !slots.includes(booking.time)) {
            setBooking(prev => ({ ...prev, time: '' }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsCheckingSlots(false);
        }
      };
      checkAvailability();
    }
  }, [step, booking.date, booking.professional, id, booking.service, booking.time]);

  if (!shop && !isLoading) {
    return (
      <ExploreLayout title="Local no encontrado">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold mb-4">Local no encontrado</h2>
          <button onClick={() => navigate('/')} className="px-6 py-2 rounded-full bg-accent text-on-primary font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            Volver al inicio
          </button>
        </div>
      </ExploreLayout>
    );
  }

  const selectService = (service: any) => {
    setBooking({ ...booking, service });
    setStep(2);
  };

  const selectProfessional = (pro: Professional) => {
    setBooking({ ...booking, professional: pro, date: '', time: '' });
    setStep(3);
  };

  const handleBooking = async () => {
    if (!booking.professional?.id || !booking.service?.id || !shop?.id || isSubmitting) return;
    if (!isAuthenticated || !user) {
      showInfo('Debes iniciar sesión para confirmar tu turno.', 'Atención');
      savePendingBooking({
        shopId: id,
        service: booking.service,
        professional: booking.professional,
        date: booking.date,
        time: booking.time
      });
      navigate(`/login?redirect=/barbershop/${id}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await appointmentApi.create({
        barbershopId: shop.id,
        professionalId: booking.professional.id,
        serviceId: booking.service.id,
        date: booking.date,
        startTime: booking.time,
      });

      clearPendingBooking();
      setStep(5);
    } catch (err: any) {
      console.error(err);
      if (err?.message === "SLOT_TAKEN") {
        showError('Ese horario acaba de ser ocupado. Por favor, elegí otro.', 'Horario no disponible');
        setBooking(prev => ({ ...prev, time: '' }));
        setStep(3);
      } else {
        showError(getAppError(err), 'Error al reservar');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ExploreLayout title={shop?.name || "Reserva de Turno"}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors mb-6 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={18} />
          <span>Volver a buscar</span>
        </button>
        
        {/* Premium Shop Header */}
        <header className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden mb-8 sm:mb-12 shadow-md">
          {/* Default Gradient Cover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/80 via-black to-black opacity-90" />
          <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80" 
            alt="Barbershop cover" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
          />
          
          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
            <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-2">
              {shop?.name || 'Cargando...'}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
              <MapPin size={18} />
              <span>{shop?.address || 'Buscando ubicación...'}</span>
            </div>
          </div>
        </header>

        {/* Wizard Container */}
        <div className="bg-surface border border-glass-border rounded-3xl shadow-lg p-6 sm:p-10 mb-20 relative overflow-hidden">
          
          {/* Stepper (Only show steps 1-4) */}
          {step < 5 && (
            <div className="mb-10 sm:mb-14 relative">
              <div className="flex justify-between items-center relative z-10 max-w-2xl mx-auto">
                {[
                  { id: 1, label: 'Servicio' },
                  { id: 2, label: 'Profesional' },
                  { id: 3, label: 'Horario' },
                  { id: 4, label: 'Resumen' }
                ].map((s) => (
                  <div 
                    key={s.id} 
                    className="flex flex-col items-center gap-2 relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                    onClick={() => step > s.id && setStep(s.id)}
                    role="button"
                    tabIndex={step > s.id ? 0 : -1}
                    onKeyDown={(e) => { if(e.key === 'Enter' && step > s.id) setStep(s.id) }}
                    style={{ cursor: step > s.id ? 'pointer' : 'default' }}
                  >
                    <div className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300",
                      step === s.id ? "bg-accent text-on-primary shadow-glow ring-4 ring-accent/20" :
                      step > s.id ? "bg-foreground text-background" : 
                      "bg-secondary text-text-muted"
                    )}>
                      {step > s.id ? <CheckCircle2 size={20} strokeWidth={3} /> : s.id}
                    </div>
                    <span className={cn(
                      "text-xs sm:text-sm font-semibold hidden sm:block",
                      step >= s.id ? "text-foreground" : "text-text-muted"
                    )}>
                      {s.label}
                    </span>
                  </div>
                ))}

                {/* Connecting Lines */}
                <div className="absolute top-5 sm:top-6 left-0 right-0 h-1 bg-secondary -z-10 rounded-full" />
                <div 
                  className="absolute top-5 sm:top-6 left-0 h-1 bg-accent -z-10 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Dynamic Content Area */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* STEP 1: SERVICE */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Seleccioná un servicio</h2>
                    <p className="text-text-secondary">Elegí el tratamiento que deseás recibir hoy.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-4 items-center p-5 rounded-2xl border border-glass-border bg-secondary/50 animate-pulse h-28" />
                      ))
                    ) : services.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center p-10 text-center bg-secondary/50 rounded-3xl">
                        <Scissors size={48} className="text-text-muted mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">Sin servicios</h3>
                        <p className="text-text-secondary">Este local aún no ha configurado sus servicios.</p>
                      </div>
                    ) : (
                      services.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => selectService(s)}
                          className="group flex items-center p-4 sm:p-5 rounded-2xl border border-glass-border bg-background hover:border-accent/50 hover:bg-accent/5 hover:shadow-glow transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          tabIndex={0}
                          onKeyDown={(e) => { if(e.key === 'Enter') selectService(s) }}
                        >
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Scissors size={22} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="flex-1 ml-4 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-foreground truncate group-hover:text-accent transition-colors">{s.name}</h3>
                            <div className="text-xs sm:text-sm text-text-secondary truncate mt-0.5">
                              {s.description ? (
                                <span>{s.description} <span className="opacity-50 mx-1">•</span> {s.duration} min</span>
                              ) : (
                                <span className="flex items-center gap-1"><Clock size={12}/> {s.duration} min</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <span className="font-black text-lg sm:text-xl text-foreground">${s.price}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PROFESSIONAL */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="text-center mb-8 relative">
                    <button onClick={() => setStep(1)} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-full transition-colors hidden sm:block text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <ArrowLeft size={24} />
                    </button>
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">¿Con quién te querés atender?</h2>
                    <p className="text-text-secondary">Seleccioná a tu profesional favorito.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professionals.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center p-10 text-center bg-secondary/50 rounded-3xl">
                        <User size={48} className="text-text-muted mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">Sin profesionales</h3>
                        <p className="text-text-secondary">No hay staff disponible en este momento.</p>
                      </div>
                    ) : (
                      professionals.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => selectProfessional(p)}
                          className="group flex items-center gap-4 p-5 rounded-2xl border border-glass-border bg-background hover:border-accent/50 hover:shadow-md transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          tabIndex={0}
                          onKeyDown={(e) => { if(e.key === 'Enter') selectProfessional(p) }}
                        >
                          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent overflow-hidden border-2 border-transparent group-hover:border-accent transition-colors">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <User size={28} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">{p.name}</h3>
                            <p className="text-sm text-text-secondary">{(p as any).specialty || 'Profesional'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: DATE & TIME */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="text-center mb-8 relative">
                    <button onClick={() => setStep(2)} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-full transition-colors hidden sm:block text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <ArrowLeft size={24} />
                    </button>
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Elegí la fecha y hora</h2>
                    <p className="text-text-secondary">Disponibilidad de {booking.professional?.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    
                    {/* Left: Date Selection */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 font-semibold text-foreground">
                        <CalendarDays size={20} className="text-accent" />
                        Seleccioná un Día
                      </label>
                      <div 
                        onClick={() => {
                          try { dateInputRef.current?.showPicker(); } catch {}
                        }}
                        className="relative bg-background border border-glass-border rounded-2xl p-4 flex items-center hover:border-accent/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-accent"
                      >
                        <input 
                          ref={dateInputRef}
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={booking.date}
                          onChange={(e) => setBooking({...booking, date: e.target.value})} 
                          onClick={(e) => {
                            e.stopPropagation();
                            try { dateInputRef.current?.showPicker(); } catch {}
                          }}
                          className="w-full bg-transparent text-foreground font-bold text-lg focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Right: Time Selection */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 font-semibold text-foreground">
                        <Clock size={20} className="text-accent" />
                        Horarios Disponibles
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {isCheckingSlots ? (
                          Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-12 rounded-xl bg-secondary animate-pulse" />
                          ))
                        ) : availableSlots.length === 0 ? (
                          <div className="col-span-full p-6 text-center border border-dashed border-glass-border rounded-2xl text-text-secondary bg-background/50">
                            {booking.date ? 'Día sin disponibilidad.' : 'Elegí una fecha primero.'}
                          </div>
                        ) : (
                          availableSlots.map(t => (
                            <button 
                              key={t} 
                              onClick={() => setBooking({...booking, time: t})}
                              className={cn(
                                "h-12 rounded-xl font-bold text-sm transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-accent",
                                booking.time === t 
                                  ? "bg-accent border-accent text-on-primary shadow-glow scale-105" 
                                  : "bg-background border-glass-border text-foreground hover:border-accent/40 hover:bg-accent/5"
                              )}
                            >
                              {t}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-28 sm:hidden"></div> {/* Spacer for fixed bottom bar */}
                  <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-background/90 backdrop-blur-xl border-t border-glass-border sm:static sm:bg-transparent sm:border-0 sm:backdrop-blur-none sm:p-0 sm:mt-12 sm:flex sm:justify-end">
                    <div className="w-full max-w-7xl mx-auto flex items-center justify-between sm:justify-end">
                      <div className="sm:hidden flex flex-col">
                        <span className="text-xs text-text-secondary font-medium uppercase">Total</span>
                        <span className="text-xl font-black text-foreground">${booking.service?.price || '0'}</span>
                      </div>
                      <button 
                        disabled={!booking.date || !booking.time}
                        onClick={() => setStep(4)}
                        className="flex-1 sm:flex-none sm:w-auto ml-6 sm:ml-0 px-8 py-3.5 rounded-full bg-accent text-on-primary font-bold hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(255,107,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: SUMMARY */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="text-center mb-8 relative">
                    <button onClick={() => setStep(3)} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-full transition-colors hidden sm:block text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <ArrowLeft size={24} />
                    </button>
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Resumen de la Reserva</h2>
                    <p className="text-text-secondary">Verificá que todo esté correcto antes de confirmar.</p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto bg-background border border-glass-border rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                        <Scissors size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">Servicio</p>
                        <p className="text-xl font-bold text-foreground">{booking.service?.name}</p>
                        <p className="text-sm text-text-muted mt-1">${booking.service?.price} • {booking.service?.duration} minutos</p>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-glass-border" />
                    
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">Profesional</p>
                        <p className="text-xl font-bold text-foreground">{booking.professional?.name}</p>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-glass-border" />
                    
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                        <CalendarDays size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">Día y Hora</p>
                        <p className="text-xl font-bold text-foreground">{booking.date.split('-').reverse().join('/')}</p>
                        <p className="text-lg font-bold text-accent mt-1">{booking.time} hs</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-28 sm:hidden"></div> {/* Spacer for fixed bottom bar */}
                  <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-background/90 backdrop-blur-xl border-t border-glass-border sm:static sm:bg-transparent sm:border-0 sm:backdrop-blur-none sm:p-0 sm:mt-10 sm:flex sm:justify-center">
                    <div className="w-full max-w-2xl mx-auto">
                      <button 
                        onClick={handleBooking}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-accent text-on-primary font-bold text-lg shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={24} className="animate-spin" /> Confirmando...</>
                        ) : (
                          <><CheckCircle2 size={24} /> Confirmar Reserva Definitiva</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: SUCCESS */}
              {step === 5 && (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="text-center py-10"
                >
                  <div className="inline-flex items-center justify-center h-28 w-28 rounded-full bg-success/10 text-success mb-6 relative">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                    >
                      <CheckCircle2 size={64} strokeWidth={2.5} />
                    </motion.div>
                    {/* Ripple rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
                  </div>
                  
                  <h2 className="font-heading text-4xl font-black text-foreground mb-4">¡Turno Confirmado!</h2>
                  <p className="text-lg text-text-secondary mb-10">
                    Tu reserva ha sido guardada exitosamente.<br/>
                    Te esperamos en <strong className="text-foreground">{shop?.name}</strong>.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                    <button 
                      onClick={() => navigate('/client/dashboard')}
                      className="flex-1 px-6 py-3.5 rounded-full bg-foreground text-background font-bold hover:bg-text-secondary transition-colors"
                    >
                      Ver mis turnos
                    </button>
                    <button 
                      onClick={() => navigate('/')}
                      className="flex-1 px-6 py-3.5 rounded-full border border-glass-border text-foreground font-bold hover:bg-surface transition-colors"
                    >
                      Volver al inicio
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ExploreLayout>
  );
};

export default BarbershopDetailsPage;
