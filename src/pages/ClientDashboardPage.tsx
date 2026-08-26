import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionGroup, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import ClientLayout from '../components/ClientLayout';
import { Loader2, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ClientDashboard.css';

interface Appointment {
  id: string;
  ref: any;
  date: string;
  startTime: string;
  status: string;
  serviceName: string;
  shopName: string;
  professionalName: string;
}

const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [appToCancel, setAppToCancel] = useState<Appointment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Ordered by date and startTime using composite index. 
    // IMPORTANT: Make sure the composite index is created in Firestore!
    const q = query(
      collectionGroup(db, 'appointments'), 
      where('clientId', '==', user.id),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() } as Appointment));
      setAppointments(apps);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <ClientLayout title="Acceso Restringido">
        <div className="client-dashboard">
          <h2>Acceso restringido</h2>
          <p>Inicia sesión para ver tus reservas.</p>
        </div>
      </ClientLayout>
    );
  }

  const confirmCancel = async () => {
    if (!appToCancel) return;
    try {
      await updateDoc(appToCancel.ref, { status: 'cancelled' });
      setAppToCancel(null);
    } catch (err) {
      console.error(err);
      alert('Error al cancelar el turno');
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
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <ClientLayout title="Mis Reservas">
      <div className="client-dashboard">
        <motion.header 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Mis Reservas</h1>
          <p>Gestiona tus próximos cortes y revisa tu historial.</p>
        </motion.header>

        <div className="tabs-container">
          {['upcoming', 'history'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab" 
                  className="tab-indicator" 
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="tab-label">{tab === 'upcoming' ? 'Próximos Turnos' : 'Historial'}</span>
            </button>
          ))}
        </div>

        <section className="appointments-section">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)', margin: '0 auto' }} />
            </div>
          ) : displayApps.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="empty-icon">📅</div>
              <p>No tienes reservas en esta sección.</p>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="book-now-btn" 
                onClick={() => navigate('/')}
              >
                Buscar Barbería
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="appointment-list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence mode="popLayout">
                {displayApps.map(app => (
                  <motion.div 
                    layout
                    variants={itemVariants}
                    key={app.id} 
                    className={`appointment-card ${app.status}`}
                  >
                    <div className="card-main">
                      <div className="date-box">
                        <span className="day">{app.date.split('-')[2]}</span>
                        <span className="month">
                          {new Date(app.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                      <div className="details">
                        <h3>{app.serviceName || 'Corte Clásico'}</h3>
                        <div className="info-row">
                          <span className="info-label">Local:</span>
                          <span className="info-value">{app.shopName || 'Barbería Central'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Profesional:</span>
                          <span className="info-value">{app.professionalName || 'Barbero'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Hora:</span>
                          <span className="info-value">{app.startTime}</span>
                        </div>
                      </div>

                      {/* Clean 3-dot menu for actions on upcoming apps */}
                      {(app.status === 'pending' || app.status === 'confirmed') && (
                        <div className="action-menu-container">
                          <button 
                            className="icon-btn" 
                            onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          <AnimatePresence>
                            {openMenuId === app.id && (
                              <motion.div 
                                className="action-dropdown"
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              >
                                <button className="cancel-action" onClick={() => {
                                  setAppToCancel(app);
                                  setOpenMenuId(null);
                                }}>
                                  Cancelar Turno
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <AnimatePresence>
          {appToCancel && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                <div className="modal-header">
                  <h3>Cancelar Turno</h3>
                  <button className="icon-btn" onClick={() => setAppToCancel(null)}><X size={20}/></button>
                </div>
                <p>Estás a punto de cancelar tu turno para el <strong>{appToCancel.date.split('-').reverse().join('/')}</strong> a las <strong>{appToCancel.startTime}</strong>.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setAppToCancel(null)}>Mantener</button>
                  <button className="btn-danger" onClick={confirmCancel}>Sí, Cancelar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboardPage;
