/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_CATEGORIES } from '../constants/categories';
import ExploreLayout from '../components/ExploreLayout';
import { Search, MapPin, Store, Loader2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useClientAppointments } from '../hooks/useClientAppointments';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Business } from '../types';

// Icons for categories and next appointment
import { Scissors, Sparkles, Droplets, Paintbrush, Heart, Coffee, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Search size={18} />,
  barberia: <Scissors size={18} />,
  peluqueria: <Sparkles size={18} />,
  spa: <Droplets size={18} />,
  estetica: <Heart size={18} />,
  unas: <Paintbrush size={18} />,
  masajes: <Coffee size={18} />
};

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'barberia',   label: 'Barberías' },
  { key: 'peluqueria', label: 'Peluquerías' },
  { key: 'spa',        label: 'Spa' },
  { key: 'estetica',   label: 'Estética' },
  { key: 'unas',       label: 'Uñas' },
  { key: 'masajes',    label: 'Masajes' },
];

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Client appointments logic
  const isClient = user?.role === 'client';
  const { appointments, isLoading: isLoadingApps } = useClientAppointments(isClient ? user?.id : undefined);

  // Compute next future appointment
  const nextAppointment = React.useMemo(() => {
    if (!isClient || !appointments.length) return null;
    const now = new Date();
    const upcoming = appointments.filter(app => {
      if (app.status !== 'pending' && app.status !== 'confirmed') return false;
      const appDate = new Date(`${app.date}T${app.startTime}:00`);
      return appDate > now;
    }).sort((a, b) => new Date(`${a.date}T${a.startTime}:00`).getTime() - new Date(`${b.date}T${b.startTime}:00`).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [appointments, isClient]);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qConstraints = [where('status', '==', 'active')];
      if (activeCategory !== 'all') {
        qConstraints.push(where('category', '==', activeCategory));
      }
      const q = query(collection(db, 'businesses'), ...qConstraints);
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
      setBusinesses(data);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Ocurrió un error al cargar los negocios. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [activeCategory]);

  // Clean search input, normalize to avoid basic casing issues
  const normalizedSearch = searchTerm.trim().toLowerCase();
  
  const filtered = businesses.filter(b => {
    if (!normalizedSearch) return true;
    const nName = (b.name || '').toLowerCase();
    const nAddress = (b.address || '').toLowerCase();
    return nName.includes(normalizedSearch) || nAddress.includes(normalizedSearch);
  });

  const clearSearch = () => setSearchTerm('');

  return (
    <ExploreLayout title="Descubrir">
      <div className="flex flex-col gap-12 pb-24">
        
        {/* COMPACT HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-surface py-16 sm:py-24 border-b border-glass-border">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-accent/5 blur-[120px] pointer-events-none" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-6"
            >
              Un momento para vos. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">
                Un lugar para encontrarlo.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-2xl text-lg text-text-secondary mb-10"
            >
              Explorá barberías, peluquerías y espacios de belleza. Elegí tu próximo turno.
            </motion.p>

            {/* SEARCH BAR */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-glass-border bg-background p-2 shadow-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-glass-border-hover"
            >
              <div className="pl-4 pr-2 text-text-muted">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Nombre o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent py-3 pr-4 text-base text-foreground placeholder:text-text-muted focus:outline-none"
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={clearSearch}
                    className="p-2 mr-1 text-text-muted hover:text-foreground rounded-full hover:bg-surface-hover transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
              <button 
                className="hidden sm:block rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Buscar
              </button>
            </motion.div>
          </div>
        </section>

        {/* CLIENT WELCOME & NEXT APPOINTMENT BLOCK */}
        {isClient && (
          <section className="mx-auto w-full max-w-7xl px-4 mt-6">
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Hola, {user?.name?.split(' ')[0] || 'Cliente'} 👋
              </h2>
              
              {isLoadingApps ? (
                <div className="flex h-24 items-center justify-center rounded-2xl border border-glass-border bg-surface-hover">
                  <Loader2 size={24} className="animate-spin text-accent" />
                </div>
              ) : nextAppointment ? (
                <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-gradient-to-r from-surface to-surface-hover p-6 shadow-sm">
                  <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold text-accent mb-2 uppercase tracking-wider">Tu Próximo Turno</p>
                      <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                        {nextAppointment.serviceName} en {nextAppointment.shopName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mt-3">
                        <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-glass-border">
                          <CalendarIcon size={16} className="text-text-muted" />
                          {new Date(`${nextAppointment.date}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-glass-border">
                          <Clock size={16} className="text-text-muted" />
                          {nextAppointment.startTime} hs
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate('/client/dashboard')}
                      className="whitespace-nowrap px-6 py-2.5 rounded-full bg-surface border border-glass-border text-sm font-bold text-foreground hover:border-accent hover:text-accent transition-colors self-start md:self-center shadow-sm"
                    >
                      Ver mis reservas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-glass-border bg-surface-hover p-6 text-center">
                  <p className="text-text-secondary mb-2">No tienes turnos próximos programados.</p>
                  <p className="text-sm text-text-muted">¡Es un gran momento para encontrar tu lugar ideal abajo!</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* HORIZONTAL CATEGORIES */}
        <section className="mx-auto w-full max-w-7xl px-4 mt-2">
          <div className="flex w-full overflow-x-auto pb-4 pt-2 scrollbar-hide md:flex-wrap md:justify-center">
            <div className="flex gap-3">
              {CATEGORY_FILTERS.map(({ key, label }) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "group flex flex-shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isActive 
                        ? "border-accent bg-accent text-on-primary shadow-glow" 
                        : "border-glass-border bg-surface text-text-secondary hover:border-accent/40 hover:bg-accent/5 hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "transition-colors", 
                      isActive ? "text-on-primary" : "text-text-muted group-hover:text-accent"
                    )}>
                      {CATEGORY_ICONS[key] || CATEGORY_ICONS['all']}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RESULTS GRID */}
        <section className="mx-auto w-full max-w-7xl px-4 min-h-[400px]">
          <div className="mb-6 flex items-baseline justify-between border-b border-glass-border pb-4">
            <h3 className="font-heading text-2xl font-bold text-foreground">
              Explorá negocios
            </h3>
            {!isLoading && !error && (
              <span className="rounded-full bg-surface-hover px-3 py-1 text-sm font-medium text-text-secondary border border-glass-border">
                {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="col-span-full flex h-64 flex-col items-center justify-center gap-4"
                >
                  <Loader2 size={32} className="animate-spin text-accent" />
                  <p className="text-text-secondary font-medium">Buscando negocios...</p>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-danger/20 bg-danger/5 py-16 text-center"
                >
                  <AlertCircle size={48} className="mb-4 text-danger opacity-80" />
                  <h4 className="mb-2 text-xl font-bold text-foreground">Error de conexión</h4>
                  <p className="text-text-secondary max-w-md mb-6">{error}</p>
                  <button 
                    onClick={fetchBusinesses}
                    className="px-6 py-2 rounded-full bg-surface border border-glass-border text-foreground hover:bg-surface-hover transition-colors font-semibold"
                  >
                    Reintentar
                  </button>
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-glass-border bg-surface-hover py-20 text-center"
                >
                  <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-glass-border">
                    <Search size={28} className="text-text-muted" />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-foreground">No hay coincidencias</h4>
                  <p className="text-text-secondary max-w-sm">
                    No encontramos locales activos con esos términos. Prueba buscando otra cosa o cambia de categoría.
                  </p>
                  {(searchTerm || activeCategory !== 'all') && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setActiveCategory('all');
                      }}
                      className="mt-6 px-6 py-2 rounded-full bg-accent text-on-primary font-semibold hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </motion.div>
              ) : filtered.map(business => {
                const cat = BUSINESS_CATEGORIES[business.category as keyof typeof BUSINESS_CATEGORIES];
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    key={business.id}
                    onClick={() => navigate(`/barbershop/${business.id}`)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-sm transition-all hover:border-accent/50 hover:shadow-glow outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    tabIndex={0}
                    onKeyDown={(e) => { if(e.key === 'Enter') navigate(`/barbershop/${business.id}`) }}
                  >
                    {/* Card Image Area (Fallback since there are no covers yet) */}
                    <div className="relative h-48 w-full overflow-hidden bg-surface-hover">
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted group-hover:scale-110 transition-transform duration-500 bg-background/50">
                        {CATEGORY_ICONS[business.category] ? (
                          <div className="opacity-20 scale-[2.5]">{CATEGORY_ICONS[business.category]}</div>
                        ) : (
                          <Store size={48} strokeWidth={1.5} className="opacity-20" />
                        )}
                      </div>
                      
                      {/* Top Badges */}
                      <div className="absolute left-3 top-3 flex gap-2">
                        {cat && (
                          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                            {CATEGORY_ICONS[business.category] || cat.icon} {cat.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex flex-col h-full">
                      <h3 className="mb-2 truncate font-heading text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                        {business.name || 'Negocio sin nombre'}
                      </h3>
                      <div className="mb-4 flex items-start gap-2 text-sm text-text-secondary">
                        <MapPin size={16} className="shrink-0 text-text-muted mt-0.5" />
                        <span className="line-clamp-2 leading-snug">{business.address || 'Dirección no especificada'}</span>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between border-t border-glass-border pt-4">
                        <span className="text-sm font-semibold text-text-secondary group-hover:text-foreground transition-colors">
                          Explorar servicios
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-text-muted transition-colors group-hover:bg-accent group-hover:text-on-primary">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          className="mx-auto w-full max-w-6xl px-4 mt-16 mb-20"
        >
          <div className="text-center mb-12">
            <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              ¿Cómo funciona?
            </motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-text-secondary mt-3 max-w-xl mx-auto">
              Reservar tu próximo turno es más fácil y rápido que nunca.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* Decorative line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            
            {[
              { step: '1', title: 'Explorá', desc: 'Buscá por nombre, ubicación o categoría de servicio.' },
              { step: '2', title: 'Elegí', desc: 'Seleccioná a tu profesional favorito y un horario disponible.' },
              { step: '3', title: 'Confirmá', desc: 'Iniciá sesión para asegurar tu reserva al instante.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -10 }}
                className="relative flex flex-col items-center rounded-3xl border border-glass-border bg-surface/40 p-8 text-center backdrop-blur-md transition-all hover:border-accent/40 hover:bg-surface shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-accent/20 text-accent shadow-[0_0_20px_rgba(255,107,0,0.1)] mb-6 relative">
                  <span className="font-heading text-2xl font-bold">{item.step}</span>
                  <div className="absolute inset-0 rounded-full border border-accent/40 animate-[spin_4s_linear_infinite]" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }} />
                </div>
                <h4 className="font-bold text-xl text-foreground mb-3">{item.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* B2B CTA SECTION (NEGOCIOS) */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto w-full max-w-5xl px-4 mt-8 mb-24"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-glass-border bg-surface p-10 sm:p-16 text-center shadow-2xl group">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-background transition-opacity duration-700 group-hover:opacity-50" />
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-[100px] transition-transform duration-1000 group-hover:translate-x-10 group-hover:translate-y-10" />
            <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-accent/10 blur-[100px] transition-transform duration-1000 group-hover:-translate-x-10 group-hover:-translate-y-10" />
            
            {/* Premium Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur-md"
              >
                <Sparkles size={14} /> Para Negocios
              </motion.span>
              
              <h2 className="mb-6 font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight">
                Elevá tu salón con <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-[#ffc745] to-accent-hover drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]">VANITY</span>
              </h2>
              
              <p className="mb-10 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto font-medium">
                Organizá tus turnos, administrá tus servicios y gestioná a tu equipo en un mismo lugar. Conocé cómo sumar tu negocio a VANITY.
              </p>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/para-negocios')}
                className="group relative px-8 py-4 rounded-full bg-foreground text-background font-black text-lg overflow-hidden transition-shadow hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] flex items-center justify-center"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-accent to-accent-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  Sumar mi negocio <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </div>
          </div>
        </motion.section>
        
      </div>
    </ExploreLayout>
  );
};

export default HomePage;
