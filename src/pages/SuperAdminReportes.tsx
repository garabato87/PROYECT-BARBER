import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Layout from '../components/Layout';
import { TrendingUp, Users, Store, Activity } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '../constants/categories';
import type { Business, User, BusinessCategory } from '../types';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const daysUntil = (dateStr?: string) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

const MONTHLY_DATA = [
  { month: 'Ene', locales: 1, usuarios: 2 },
  { month: 'Feb', locales: 1, usuarios: 2 },
  { month: 'Mar', locales: 2, usuarios: 3 },
  { month: 'Abr', locales: 2, usuarios: 3 },
  { month: 'May', locales: 3, usuarios: 4 },
  { month: 'Jun', locales: 3, usuarios: 4 },
];

type Role = 'super-admin' | 'admin' | 'professional' | 'client';

const ROLE_COLORS: Record<Role, string> = {
  'super-admin':  '#f59e0b', // amber-500
  'admin':        '#3b82f6', // blue-500
  'professional': '#10b981', // emerald-500
  'client':       '#94a3b8', // slate-400
};

const ROLE_LABELS: Record<Role, string> = {
  'super-admin':  'Super Admin',
  'admin':        'Administrador',
  'professional': 'Profesional',
  'client':       'Cliente',
};

const SuperAdminReportes: React.FC = () => {
  const [shops, setShops] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      setLoading(false);
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    return () => {
      unsubShops();
      unsubUsers();
    };
  }, []);

  const stats = useMemo(() => {
    const active = shops.filter(s => s.status === 'active').length;
    const expiring = shops.filter(s => { const d = daysUntil(s.expirationDate); return d >= 0 && d <= 90; }).length;
    
    return [
      { label: 'Total locales',    value: shops.length,       Icon: Store,       color: 'text-accent',   bg: 'bg-accent/10' },
      { label: 'Locales activos',  value: active,             Icon: Activity,    color: 'text-success', bg: 'bg-success/10' },
      { label: 'Total usuarios',   value: users.length,       Icon: Users,       color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Por vencer (90d)', value: expiring,           Icon: TrendingUp,  color: 'text-danger',     bg: 'bg-danger/10' },
    ];
  }, [shops, users]);

  const roleData = useMemo(() => {
    const counts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(ROLE_LABELS).map(role => ({
      name: ROLE_LABELS[role as Role],
      value: counts[role] ?? 0,
      color: ROLE_COLORS[role as Role]
    })).filter(d => d.value > 0);
  }, [users]);

  const categoryData = useMemo(() => {
    const counts = shops.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([cat, count]) => {
      const info = BUSINESS_CATEGORIES[cat as BusinessCategory];
        return {
          id: cat,
          label: info?.label,
          icon: info?.icon,
          count,
          pct: shops.length > 0 ? Math.round((count / shops.length) * 100) : 0
        };
    }).sort((a, b) => b.count - a.count);
  }, [shops]);

  if (loading) {
    return (
      <Layout title="Gestión de Reportes">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Reportes">
      <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-glass-border pb-8">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Panel Super Admin</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Reportes y <span className="text-accent">Métricas</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Visión global del crecimiento, salud de la plataforma y distribución de clientes.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, color, bg, Icon }, i) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-glass-border rounded-2xl p-5 flex items-center gap-4 hover:bg-surface-hover transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
                <span className={`text-2xl font-black leading-none ${color}`}>{value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Growth Chart */}
          <div className="lg:col-span-2 bg-surface border border-glass-border rounded-2xl p-6 flex flex-col h-[400px]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Crecimiento Mensual</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent" />
                  <span className="text-xs text-text-secondary font-bold">Locales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-xs text-text-secondary font-bold">Usuarios</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => Math.floor(val).toString()}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '0.75rem', 
                      color: '#f8fafc',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ fontSize: '0.875rem' }}
                  />
                  <Bar dataKey="locales" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="usuarios" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Role Distribution Pie Chart */}
            <div className="bg-surface border border-glass-border rounded-2xl p-6 flex flex-col h-[280px]">
              <h3 className="text-sm font-bold text-foreground mb-2">Distribución de Roles</h3>
              <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b', 
                        borderRadius: '0.75rem', 
                        color: '#f8fafc',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-foreground">{users.length}</span>
                  <span className="text-xs font-bold text-text-muted">Usuarios</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-surface border border-glass-border rounded-2xl p-6 flex-1 flex flex-col min-h-[220px]">
              <h3 className="text-sm font-bold text-foreground mb-4">Tipos de Negocio</h3>
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No hay locales registrados</p>
                ) : (
                  categoryData.map(cat => (
                    <div key={cat.id} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">{cat.icon} {cat.label}</span>
                        <span className="text-xs text-text-muted">{cat.count} ({cat.pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full transition-all duration-1000" 
                          style={{ width: `${cat.pct}%` }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SuperAdminReportes;
