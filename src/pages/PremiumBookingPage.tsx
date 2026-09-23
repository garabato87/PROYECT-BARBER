import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, collection, getDocs, query, where, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getAvailableSlots, type Professional, type Appointment } from '../utils/availability';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Scissors, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to generate next 14 days
const generateDays = (daysToGenerate: number = 14) => {
  const days = [];
  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dateObj: d,
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0,3),
      dayNumber: d.getDate()
    });
  }
  return days;
};

const PremiumBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { error: showError, success } = useToast();
  
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Booking State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  const availableDays = generateDays(14);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'businesses', id));
        if (shopDoc.exists()) {
          setShop({ id: shopDoc.id, ...shopDoc.data() });
        } else {
          showError("Barbería no encontrada");
          navigate('/');
          return;
        }

        const srvSnap = await getDocs(collection(db, 'businesses', id, 'services'));
        setServices(srvSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const proSnap = await getDocs(collection(db, 'businesses', id, 'professionals'));
        const pros = proSnap.docs.map(d => ({ id: d.id, ...d.data() } as Professional))
          .filter(p => p.isActive);
        setProfessionals(pros);

        // Real-time appointments for the shop
        const q = query(
          collection(db, 'businesses', id, 'appointments'),
          where('status', 'in', ['pending', 'confirmed'])
        );
        onSnapshot(q, (snap) => {
          setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
          setIsLoading(false);
        });

      } catch (err) {
        showError("Error al cargar datos");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, showError]);

  // Derived State: Available Slots
  const availableSlots = React.useMemo(() => {
    if (!selectedPro || !selectedDate || !selectedService) return [];
    
    // Check if the selected date is today to avoid past times
    const targetDate = new Date(selectedDate + 'T00:00:00');
    return getAvailableSlots(
      targetDate,
      selectedPro,
      appointments,
      selectedService.duration
    );
  }, [selectedPro, selectedDate, selectedService, appointments]);

  // Reset time if it becomes unavailable
  useEffect(() => {
    if (selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [availableSlots, selectedTime]);

  const handleBook = async () => {
    if (!isAuthenticated) {
      showError("Debes iniciar sesión para reservar");
      navigate('/login', { state: { returnTo: `/b/${id}/premium` } });
      return;
    }

    if (!selectedService || !selectedPro || !selectedDate || !selectedTime) {
      showError("Por favor completa todos los pasos");
      return;
    }

    setIsBooking(true);
    try {
      const appointmentId = `${selectedPro.id}_${selectedDate}_${selectedTime.replace(':', '')}`;
      const appointmentRef = doc(db, 'businesses', id!, 'appointments', appointmentId);

      await runTransaction(db, async (transaction) => {
        const docSnapshot = await transaction.get(appointmentRef);
        if (docSnapshot.exists()) {
          throw new Error("SLOT_TAKEN");
        }

        const endTime = (() => {
          const [h, m] = selectedTime.split(':').map(Number);
          const totalMins = h * 60 + m + (selectedService.duration || 30);
          return `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
        })();

        transaction.set(appointmentRef, {
          barbershopId: id,
          clientId: user?.id,
          clientName: user?.name,
          clientPhone: user?.phone || '',
          clientEmail: user?.email || '',
          shopName: shop.name,
          serviceName: selectedService.name,
          professionalName: selectedPro.name,
          professionalId: selectedPro.id,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          endTime,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      });

      // Intentar enviar email de confirmación (sin bloquear la navegación)
      if (user?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            type: 'confirmation',
            data: {
              clientName: user.name,
              shopName: shop.name,
              serviceName: selectedService.name,
              professionalName: selectedPro.name,
              date: selectedDate,
              startTime: selectedTime,
            }
          })
        }).catch(err => console.error('Error sending confirmation email:', err));
      }

      success("¡Turno confirmado exitosamente!");
      navigate('/mis-turnos');
    } catch (error: any) {
      if (error.message === 'SLOT_TAKEN') {
        showError("El horario acaba de ser ocupado. Por favor elige otro.");
        setSelectedTime('');
      } else {
        showError(getAppError(error));
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-white font-sans pb-32">
      {/* Navbar/Header */}
      <header className="sticky top-0 z-40 bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-heading font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">
          {shop?.name?.toUpperCase() || 'BARBER ELITE'}
        </h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8">
        
        {/* Date Selection (Horizontal Scroll) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Fecha</h2>
            <div className="text-sm text-white/50 flex items-center gap-1 font-medium">
              <CalendarIcon size={14}/> {new Date(selectedDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {availableDays.map((day) => {
              const isSelected = selectedDate === day.dateString;
              return (
                <button
                  key={day.dateString}
                  onClick={() => setSelectedDate(day.dateString)}
                  className={cn(
                    "snap-start flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115] focus-visible:ring-accent",
                    isSelected 
                      ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-wider mb-1">{day.dayName}</span>
                  <span className={cn("text-xl font-black", isSelected ? "text-white" : "text-white/80")}>
                    {day.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Professionals (Horizontal Scroll) */}
        <section>
          <h2 className="text-xl font-bold mb-4">Peluqueros</h2>
          <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {professionals.map(pro => {
              const isSelected = selectedPro?.id === pro.id;
              return (
                <button
                  key={pro.id}
                  onClick={() => {
                    setSelectedPro(pro);
                    setSelectedTime('');
                  }}
                  className="snap-start flex-shrink-0 flex flex-col items-center gap-2 outline-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115] focus-visible:ring-accent rounded-full"
                >
                  <div className={cn(
                    "relative p-[3px] rounded-full transition-all",
                    isSelected ? "bg-gradient-to-tr from-accent to-orange-400 shadow-[0_0_15px_rgba(255,107,0,0.4)]" : "bg-transparent border-2 border-white/10 group-hover:border-white/30"
                  )}>
                    <img 
                      src={pro.photoURL || `https://ui-avatars.com/api/?name=${pro.name}&background=1a1d24&color=fff`} 
                      alt={pro.name}
                      className="w-16 h-16 rounded-full object-cover border-[3px] border-[#0F1115]"
                    />
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 bg-accent text-on-primary p-1 rounded-full shadow-lg border-2 border-[#0F1115]">
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold transition-colors mt-1",
                    isSelected ? "text-accent" : "text-white/70"
                  )}>
                    {pro.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Services (Glass Cards) */}
        <section>
          <h2 className="text-xl font-bold mb-4">Servicios</h2>
          <div className="space-y-3">
            {services.map(srv => {
              const isSelected = selectedService?.id === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => {
                    setSelectedService(srv);
                    setSelectedTime('');
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115] focus-visible:ring-accent",
                    isSelected 
                      ? "bg-accent/10 border-accent/50 shadow-[0_0_20px_rgba(255,107,0,0.15)]" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-colors",
                      isSelected ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"
                    )}>
                      <Scissors size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className={cn("font-bold text-lg leading-tight", isSelected ? "text-white" : "text-white/90")}>{srv.name}</h3>
                      <p className="text-sm text-white/50 flex items-center gap-1 mt-1">
                        <Clock size={14}/> {srv.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-xl font-black block", isSelected ? "text-accent" : "text-white")}>
                      ${srv.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time Slots */}
        <AnimatePresence>
          {selectedPro && selectedService && selectedDate && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-4 pt-4 border-t border-white/10">Horarios Disponibles</h2>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map(time => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-3 rounded-xl text-center font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115] focus-visible:ring-accent",
                          isSelected 
                            ? "bg-accent border-accent text-on-primary shadow-[0_4px_14px_rgba(255,107,0,0.4)]" 
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-white/60">No hay horarios disponibles para esta fecha.</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

      </main>

      {/* Sticky Bottom Bar */}
      <AnimatePresence>
        {selectedService && selectedPro && selectedTime && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-[#1A1D24]/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center justify-between pointer-events-auto">
              <div>
                <p className="text-sm text-white/60 font-medium">Total a pagar</p>
                <p className="text-2xl font-black text-white">${selectedService.price}</p>
              </div>
              <button 
                onClick={handleBook}
                disabled={isBooking}
                className="bg-accent hover:bg-accent-hover text-on-primary px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(255,107,0,0.4)] transition-all disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1D24]"
              >
                {isBooking ? 'Agendando...' : 'Confirmar Turno'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global Style Override for hiding scrollbars on this specific page */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default PremiumBookingPage;
