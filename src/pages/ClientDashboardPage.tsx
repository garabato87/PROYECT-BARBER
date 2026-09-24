/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useClientAppointments, type Appointment } from '../hooks/useClientAppointments';
import ExploreLayout from '../components/ExploreLayout';
import { Loader2, MoreVertical, X, Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import { appointmentApi } from '../services/api';

const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const { appointments, isLoading } = useClientAppointments(user?.id);
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [appToCancel, setAppToCancel] = useState<Appointment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (!user) {
    return (
      <ExploreLayout title="Acceso Restringido">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="h-20 w-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
            <Lock size={32} />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Acceso restringido</h2>
          <p className="text-text-secondary mb-8">Iniciá sesión para ver tus reservas y gestionar tus turnos.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-full bg-accent text-on-primary font-semibold shadow-glow hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Iniciar Sesión
          </button>
        </div>
      </ExploreLayout>
    );
  }

  const confirmCancel = async () => {
    if (!appToCancel) return;
      try {
        await appointmentApi.update(appToCancel.barbershopId!, appToCancel.id!, 'cancelled');

        success('Turno cancelado exitosamente');
        setAppToCancel(null);
      } catch (err) {
        console.error(err);
        showError(getAppError(err), 'Error al cancelar el turno');
      }
  };

  const upcomingApps = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const historyApps = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'absent');
  const displayApps = activeTab === 'upcoming' ? upcomingApps : historyApps;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <ExploreLayout title="Mis Reservas">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:text-left"
        >
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-3">
            Mis Reservas
          </h1>
          <p className="text-lg text-text-secondary">
            Gestioná tus próximos cortes y revisá tu historial de servicios.
          </p>
        </motion.header>

        {/* Tabs - Segmented Control */}
        <div className="flex justify-center sm:justify-start mb-10">
          <div className="relative flex p-1.5 bg-surface border border-glass-border rounded-full shadow-sm">
            {['upcoming', 'history'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "relative z-10 px-6 py-2.5 text-sm font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    isActive ? "text-on-primary" : "text-text-secondary hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="clientDashTab"
                      className="absolute inset-0 bg-accent rounded-full -z-10 shadow-glow"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {tab === 'upcoming' ? 'Próximos Turnos' : 'Historial'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments List */}
        <section className="min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : displayApps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center bg-surface border border-glass-border rounded-3xl p-8 shadow-sm"
            >
              <div className="h-16 w-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={28} />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">No hay turnos aquí</h3>
              <p className="text-text-secondary mb-6 max-w-sm">
                No tenés reservas {activeTab === 'upcoming' ? 'pendientes en este momento' : 'en tu historial previo'}.
              </p>
              {activeTab === 'upcoming' && (
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-full bg-foreground text-background font-semibold hover:bg-text-secondary transition-colors"
                >
                  Buscar Barbería
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {displayApps.map(app => {
                  const isUpcoming = app.status === 'pending' || app.status === 'confirmed';
                  const dateObj = new Date(app.date + 'T00:00:00');
                  
                  return (
                    <motion.div 
                      layout
                      variants={itemVariants}
                      key={app.id} 
                      className={cn(
                        "relative bg-surface border rounded-2xl p-5 sm:p-6 transition-all",
                        app.status === 'cancelled' ? "border-danger/20 opacity-75" : "border-glass-border hover:border-accent/30 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        
                        {/* Date Calendar Box */}
                        <div className={cn(
                          "flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-0 sm:w-24 sm:h-24 rounded-xl border p-3 sm:p-0 flex-shrink-0",
                          app.status === 'cancelled' 
                            ? "bg-danger/5 border-danger/10 text-danger" 
                            : "bg-accent/10 border-accent/20 text-accent"
                        )}>
                          <span className="text-2xl sm:text-3xl font-black leading-none">{app.date.split('-')[2]}</span>
                          <span className="text-sm font-semibold tracking-widest uppercase">
                            {dateObj.toLocaleString('es-ES', { month: 'short' })}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-heading text-xl font-bold text-foreground">
                              {app.serviceName || 'Corte Clásico'}
                            </h3>
                            
                            {/* Status Badge (Mobile view mostly, or hidden if action menu exists) */}
                            {app.status === 'cancelled' && (
                              <span className="px-3 py-1 bg-danger/10 text-danger text-xs font-bold rounded-full uppercase tracking-wider">
                                Cancelado
                              </span>
                            )}
                            {app.status === 'completed' && (
                              <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full uppercase tracking-wider">
                                Completado
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-text-muted" />
                              <span className="font-medium text-foreground">{app.shopName || 'Barbería Central'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserIcon size={16} className="text-text-muted" />
                              <span>{app.professionalName || 'Barbero'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-text-muted" />
                              <span className="font-medium text-accent">{app.startTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Menu (Only Upcoming) */}
                        {isUpcoming && (
                          <div className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto">
                            <button 
                              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-muted transition-colors"
                              onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                            >
                              <MoreVertical size={20} />
                            </button>
                            
                            <AnimatePresence>
                              {openMenuId === app.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute right-4 top-14 sm:right-0 sm:top-12 z-50 w-48 bg-surface border border-glass-border rounded-xl shadow-lg p-1"
                                  >
                                    <button 
                                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                      onClick={() => {
                                        setAppToCancel(app);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      Cancelar Turno
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Cancel Modal */}
        <AnimatePresence>
          {appToCancel && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-background border border-glass-border rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-glass-border">
                  <h3 className="font-heading text-xl font-bold text-foreground">Cancelar Turno</h3>
                  <button 
                    onClick={() => setAppToCancel(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-muted transition-colors"
                  >
                    <X size={20}/>
                  </button>
                </div>
                
                <div className="p-6">
                  <p className="text-text-secondary leading-relaxed mb-8">
                    Estás a punto de cancelar tu turno para el <strong className="text-foreground">{appToCancel.date.split('-').reverse().join('/')}</strong> a las <strong className="text-foreground">{appToCancel.startTime}</strong> con <strong className="text-foreground">{appToCancel.professionalName}</strong>.
                    <br/><br/>Esta acción no se puede deshacer.
                  </p>
                  
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-foreground bg-surface border border-glass-border hover:bg-surface-hover transition-colors"
                      onClick={() => setAppToCancel(null)}
                    >
                      Mantener turno
                    </button>
                    <button 
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-danger hover:bg-danger/90 transition-colors shadow-sm"
                      onClick={confirmCancel}
                    >
                      Sí, Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ExploreLayout>
  );
};

export default ClientDashboardPage;
