import React, { useState, useMemo } from 'react';
import { BUSINESS_CATEGORIES } from '../mocks/db';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { Store, Users, CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
import type { Business, User } from '../types';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';

const EXPIRY_WARNING_DAYS = 90;

const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const SuperAdminDashboard: React.FC = () => {
  const { success, error: showError } = useToast();
  const [shops, setShops] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubShops = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
      setShops(data);
      setLoading(false);
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(data);
    });

    return () => {
      unsubShops();
      unsubUsers();
    };
  }, []);

  const getOwnerName = (ownerId: string) =>
    users.find(u => u.id === ownerId)?.name ?? 'Desconocido';

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'businesses', id), { status: newStatus });
      success(`Local ${newStatus === 'active' ? 'activado' : 'suspendido'} exitosamente`);
    } catch (error) {
      console.error('Error toggling status:', error);
      showError(getAppError(error), 'Error al cambiar el estado.');
    }
  };

  const activeCount   = shops.filter(s => s.status === 'active').length;
  const inactiveCount = shops.filter(s => s.status === 'inactive').length;

  const expiringSoon = shops.filter(s => {
    const d = daysUntil(s.expirationDate);
    return d >= 0 && d <= EXPIRY_WARNING_DAYS && s.status === 'active';
  });

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    shops.forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1; });
    return Object.entries(counts).map(([cat, count]) => ({
      cat,
      count,
      info: BUSINESS_CATEGORIES[cat as keyof typeof BUSINESS_CATEGORIES],
      pct: Math.round((count / shops.length) * 100),
    }));
  }, [shops]);

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.address.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = [
    { label: 'Total Locales',          value: shops.length,   icon: Store,          accent: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Suscripciones Activas',  value: activeCount,    icon: CheckCircle,    accent: 'text-success', bg: 'bg-success/10' },
    { label: 'Inactivas / Vencidas',   value: inactiveCount,  icon: AlertTriangle,  accent: 'text-danger', bg: 'bg-danger/10' },
    { label: 'Usuarios Registrados',   value: users.length, icon: Users,        accent: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  if (loading) {
    return (
      <Layout title="Panel Super Admin">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel Super Admin">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-glass-border">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Sistema de Gestión de Peluquerías</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Panel de <span className="text-accent">Control</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Supervisá el estado global, métricas y actividad de todos los locales registrados en la plataforma.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-glass-border rounded-2xl p-6 flex items-center gap-5 hover:bg-surface-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.accent}`}>
                <stat.icon size={26} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</span>
                <span className={`text-3xl font-black leading-none ${stat.accent}`}>{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-3 bg-accent/10 border border-amber-500/20 rounded-xl p-4 mb-8 text-sm text-accent"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              <strong className="font-bold">{expiringSoon.length}</strong>{' '}
              {expiringSoon.length === 1 ? 'local vence' : 'locales vencen'} en los próximos {EXPIRY_WARNING_DAYS} días:
            </span>
            {expiringSoon.map(s => (
              <span key={s.id} className="bg-accent/20 border border-amber-500/30 rounded-full px-3 py-0.5 text-xs font-bold">
                {s.name} · {daysUntil(s.expirationDate)}d
              </span>
            ))}
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start min-w-0 w-full max-w-full">

          {/* Shops Table */}
          <div className="bg-surface border border-glass-border rounded-2xl overflow-hidden shadow-sm min-w-0 w-full max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-glass-border">
              <h3 className="text-lg font-bold text-foreground">Locales registrados</h3>
              <div className="flex items-center gap-2 bg-background border border-glass-border rounded-xl px-3 py-2 text-text-muted focus-within:border-accent/50 focus-within:text-foreground transition-colors w-full sm:w-auto">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar local..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-foreground w-full sm:w-48 placeholder:text-text-muted/50"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background border-b border-glass-border">
                    <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest">Local</th>
                    <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest">Responsable</th>
                    <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest">Vencimiento</th>
                    <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest">Estado</th>
                    <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-muted">
                        No hay locales registrados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(shop => {
                      const days = daysUntil(shop.expirationDate);
                      const warning = days >= 0 && days <= EXPIRY_WARNING_DAYS && shop.status === 'active';
                      const cat = BUSINESS_CATEGORIES[shop.category];
                      return (
                        <tr key={shop.id} className={`hover:bg-background/50 transition-colors ${warning ? 'bg-accent/5' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="text-xl shrink-0 text-accent">{cat?.icon}</span>
                              <div>
                                <strong className="block text-sm font-bold text-foreground">{shop.name}</strong>
                                <span className="block text-xs text-text-muted mt-0.5">{shop.address}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-text-secondary">{getOwnerName(shop.ownerId)}</td>
                          <td className="py-4 px-6">
                            {warning ? (
                              <div className="flex items-center gap-2 text-sm text-accent font-medium">
                                {shop.expirationDate}
                                <span className="bg-accent/20 text-accent border border-amber-500/30 rounded px-1.5 py-0.5 text-xs font-bold">
                                  {days}d
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-text-secondary">{shop.expirationDate}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                              shop.status === 'active' 
                                ? 'bg-success/10 text-success border-success/20' 
                                : 'bg-danger/10 text-danger border-danger/20'
                            }`}>
                              {shop.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                  shop.status === 'active' 
                                    ? 'border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50 focus:ring-danger/50' 
                                    : 'border-success/30 text-success hover:bg-success/10 hover:border-success/50 focus:ring-success/50'
                                }`}
                                onClick={() => toggleStatus(shop.id, shop.status)}
                              >
                                {shop.status === 'active' ? 'Suspender' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panels */}
          <div className="flex flex-col gap-6">

            {/* Category Breakdown */}
            <div className="bg-surface border border-glass-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-glass-border">
                <h3 className="text-sm font-bold text-foreground">Tipos de negocio</h3>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {categoryBreakdown.map(({ cat, count, info, pct }) => (
                  <div key={cat} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-text-secondary">{info?.icon} {info?.label}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-accent to-amber-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-surface border border-glass-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-glass-border">
                <h3 className="text-sm font-bold text-foreground">Estado del sistema</h3>
              </div>
              <div className="p-5 flex flex-col divide-y divide-glass-border">
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-text-muted">Tasa de activación</span>
                  <span className="font-bold text-success">
                    {shops.length > 0 ? Math.round((activeCount / shops.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-text-muted">Suscripciones en riesgo</span>
                  <span className={`font-bold ${expiringSoon.length > 0 ? 'text-accent' : 'text-success'}`}>
                    {expiringSoon.length > 0 ? `${expiringSoon.length} alerta${expiringSoon.length > 1 ? 's' : ''}` : 'Sin alertas'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 text-sm">
                  <span className="text-text-muted">Usuarios promedio p/local</span>
                  <span className="font-bold text-foreground">
                    {shops.length > 0 ? (users.length / shops.length).toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 text-sm">
                  <span className="text-text-muted">Categorías distintas</span>
                  <span className="font-bold text-foreground">{categoryBreakdown.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default SuperAdminDashboard;
