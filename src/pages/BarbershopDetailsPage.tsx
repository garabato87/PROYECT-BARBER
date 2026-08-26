import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Clock, CalendarDays, User, Scissors, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getAvailableSlots, type Professional, type Appointment } from '../utils/availability';
import { useAuth } from '../hooks/useAuth';
import ClientLayout from '../components/ClientLayout';
import { motion, AnimatePresence } from 'framer-motion';
import './BarbershopDetails.css';

const BarbershopDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [step, setStep] = useState(1); 
  const [booking, setBooking] = useState({
    service: null as any,
    professional: null as Professional,
    date: '',
    time: ''
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (step === 3 && booking.professional && booking.date && id) {
      const checkAvailability = async () => {
        setIsCheckingSlots(true);
        try {
          // Fetch appointments for this professional on this date to find overlaps
          const appQ = query(
            collection(db, 'businesses', id, 'appointments'),
            where('professionalId', '==', booking.professional.id),
            where('date', '==', booking.date)
          );
          const snap = await getDocs(appQ);
          const apps = snap.docs.map(d => d.data() as Appointment);
          
          // Safe local date parsing
          const [year, month, day] = booking.date.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          
          const slots = getAvailableSlots(d, booking.professional, apps, booking.service?.duration || 30);
          setAvailableSlots(slots);
          
          // Reset selected time if it's no longer available
          if (!slots.includes(booking.time)) {
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
  }, [step, booking.date, booking.professional, id, booking.service]);

  if (isLoading) {
    return (
      <ClientLayout title="Cargando...">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={32} className="spinner accent-text" />
        </div>
      </ClientLayout>
    );
  }

  if (!shop) return <ClientLayout title="Error"><div className="glass-panel p-8">Local no encontrado</div></ClientLayout>;

  const selectService = (service: any) => {
    setBooking({ ...booking, service });
    setStep(2);
  };

  const selectProfessional = (pro: Professional) => {
    setBooking({ ...booking, professional: pro, date: '', time: '' });
    setStep(3);
  };

  const handleBooking = async () => {
    if (!isAuthenticated || !user) {
      alert('Debes iniciar sesión para confirmar tu turno.');
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'businesses', shop.id, 'appointments'), {
        barbershopId: shop.id,
        clientId: user.id,
        clientName: user.name,
        clientPhone: user.phone || '',
        shopName: shop.name,
        serviceName: booking.service.name,
        professionalName: booking.professional.name,
        professionalId: booking.professional.id,
        serviceId: booking.service.id,
        date: booking.date,
        startTime: booking.time,
        // calculate end time
        endTime: (() => {
          const [h, m] = booking.time.split(':').map(Number);
          const totalMins = h * 60 + m + (booking.service?.duration || 30);
          return `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
        })(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('Hubo un error al crear la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout title="Reserva de Turno">
      <div className="details-container animate-fade">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          Volver a buscar
        </button>
        
        <header className="shop-header-premium">
          <div className="shop-cover"></div>
          <div className="shop-info-glass glass-panel">
            <h1>{shop.name}</h1>
            <div className="location-row text-muted">
              <MapPin size={18} />
              <span>{shop.address}</span>
            </div>
          </div>
        </header>

        <div className="booking-wizard glass-panel">
          <div className="steps-indicator">
            <div 
              className={`step-premium ${step >= 1 ? 'active' : ''} ${step > 1 ? 'clickable' : ''}`}
              onClick={() => step > 1 && setStep(1)}
            >
              <div className="step-circle">1</div>
              <span>Servicio</span>
            </div>
            <div 
              className={`step-premium ${step >= 2 ? 'active' : ''} ${step > 2 ? 'clickable' : ''}`}
              onClick={() => step > 2 && setStep(2)}
            >
              <div className="step-circle">2</div>
              <span>Profesional</span>
            </div>
            <div 
              className={`step-premium ${step >= 3 ? 'active' : ''} ${step > 3 ? 'clickable' : ''}`}
              onClick={() => step > 3 && setStep(3)}
            >
              <div className="step-circle">3</div>
              <span>Fecha y Hora</span>
            </div>
            <div className={`step-premium ${step >= 4 ? 'active' : ''}`}>
              <div className="step-circle">4</div>
              <span>Confirmación</span>
            </div>
          </div>

          <div className="step-content" style={{ position: 'relative', minHeight: '300px' }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="selection-area"
                >
                  <h2 className="step-title">Selecciona un servicio</h2>
                  <p className="text-muted mb-4">Elige el tratamiento que deseas recibir hoy.</p>
                  <div className="list-grid">
                    {services.map(s => (
                      <div key={s.id} className="item-card-premium" onClick={() => selectService(s)}>
                        <div className="item-icon-box">
                          <Scissors size={24} className="accent-text" />
                        </div>
                        <div className="item-details">
                          <h3>{s.name}</h3>
                          <p className="text-muted">{s.description}</p>
                        </div>
                        <div className="item-price">
                          <span className="price-tag">${s.price}</span>
                          <span className="duration-tag"><Clock size={12}/> {s.duration}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="selection-area"
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    <button className="icon-btn" onClick={() => setStep(1)}><ArrowLeft size={20} /></button>
                    <h2 className="step-title" style={{ margin: 0 }}>¿Con quién quieres atenderte?</h2>
                  </div>
                  <div className="list-grid">
                    {professionals.map(p => (
                      <div key={p.id} className="item-card-premium" onClick={() => selectProfessional(p)}>
                        <div className="pro-avatar">
                          <User size={28} />
                        </div>
                        <div className="item-details">
                          <h3>{p.name}</h3>
                          <p className="text-muted">{p.specialty || 'Profesional'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="selection-area"
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    <button className="icon-btn" onClick={() => setStep(2)}><ArrowLeft size={20} /></button>
                    <h2 className="step-title" style={{ margin: 0 }}>Elige la fecha y hora</h2>
                  </div>
                  <div className="datetime-layout">
                    <div className="date-picker-box">
                      <label>Fecha</label>
                      <input 
                        type="date" 
                        className="premium-input"
                        min={new Date().toISOString().split('T')[0]}
                        value={booking.date}
                        onChange={(e) => setBooking({...booking, date: e.target.value})} 
                      />
                    </div>
                    <div className="time-picker-box">
                      <label>Horarios Disponibles</label>
                      <div className="time-grid-premium">
                        {isCheckingSlots ? (
                          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem' }}>
                            <Loader2 size={24} className="spinner accent-text" />
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div style={{ gridColumn: '1/-1', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {booking.date ? 'No hay horarios disponibles para esta fecha.' : 'Selecciona una fecha.'}
                          </div>
                        ) : (
                          availableSlots.map(t => (
                            <button 
                              key={t} 
                              className={`time-btn-premium ${booking.time === t ? 'selected' : ''}`}
                              onClick={() => setBooking({...booking, time: t})}
                            >
                              {t}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="step-actions">
                    <button 
                      className="btn-primary-large" 
                      disabled={!booking.date || !booking.time || isSubmitting}
                      onClick={handleBooking}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {isSubmitting && <Loader2 size={18} className="spinner" />}
                      Confirmar Reserva
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="success-area"
                >
                  <div className="success-icon-wrapper">
                    <CheckCircle2 size={80} className="success-icon" />
                  </div>
                  <h2>¡Reserva Confirmada!</h2>
                  <p className="text-muted">Te esperamos en <strong>{shop.name}</strong></p>
                  
                  <div className="summary-card glass-panel">
                    <div className="summary-row">
                      <Scissors size={20} className="text-muted" />
                      <div>
                        <span className="label">Servicio</span>
                        <span className="value">{booking.service?.name}</span>
                      </div>
                    </div>
                    <div className="summary-row">
                      <User size={20} className="text-muted" />
                      <div>
                        <span className="label">Profesional</span>
                        <span className="value">{booking.professional?.name}</span>
                      </div>
                    </div>
                    <div className="summary-row">
                      <CalendarDays size={20} className="text-muted" />
                      <div>
                        <span className="label">Fecha y Hora</span>
                        <span className="value">{booking.date} a las {booking.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn-secondary-large" onClick={() => navigate('/client/dashboard')}>
                    Ir a Mis Reservas
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default BarbershopDetailsPage;
