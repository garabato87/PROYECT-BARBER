import React, { useState } from 'react';
import { BUSINESS_CATEGORIES } from '../mocks/db';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Layout from '../components/Layout';
import { TrendingUp, Users, Store, Activity } from 'lucide-react';
import './SuperAdmin.css';

const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const MONTHLY_DATA = [
  { month: 'Ene', shops: 1, users: 2 },
  { month: 'Feb', shops: 1, users: 2 },
  { month: 'Mar', shops: 2, users: 3 },
  { month: 'Abr', shops: 2, users: 3 },
  { month: 'May', shops: 3, users: 4 },
  { month: 'Jun', shops: 3, users: 4 },
];

const ROLE_COLORS: Record<string, string> = {
  'super-admin':  '#fbbf24',
  'admin':        '#3b82f6',
  'professional': '#10b981',
  'client':       '#64748b',
};

const ROLE_LABELS: Record<string, string> = {
  'super-admin':  'Super Admin',
  'admin':        'Administrador',
  'professional': 'Profesional',
  'client':       'Cliente',
};

const SuperAdminReportes: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => {
    const unsubShops = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubShops();
      unsubUsers();
    };
  }, []);

  const active   = shops.filter(s => s.status === 'active').length;
  const expiring = shops.filter(s => { const d = daysUntil(s.expirationDate); return d >= 0 && d <= 90; }).length;

  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const catCount = shops.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxShops = Math.max(...MONTHLY_DATA.map(d => d.shops));
  const maxUsers = Math.max(...MONTHLY_DATA.map(d => d.users));

  return (
    <Layout title="Reportes">
      <div className="sa-root animate-slide-up">

        {/* Header */}
        <div className="sa-header">
          <div>
            <p className="sa-header-eyebrow">Analíticas de plataforma</p>
            <h1 className="sa-header-title">Reportes y <span>métricas</span></h1>
            <p className="sa-header-sub">Visión global del crecimiento y salud de la plataforma.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="sa-stats-grid">
          {[
            { label: 'Total locales',    value: shops.length,       Icon: Store,       color: '#fbbf24' },
            { label: 'Locales activos',  value: active,             Icon: Activity,    color: '#10b981' },
            { label: 'Total usuarios',   value: users.length,       Icon: Users,       color: '#3b82f6' },
            { label: 'Por vencer (90d)', value: expiring,           Icon: TrendingUp,  color: '#f59e0b' },
          ].map(({ label, value, Icon, color }, i) => (
            <div key={i} className="sa-stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="sa-stat-icon" style={{ background: `${color}18`, color }}>
                <Icon size={22} />
              </div>
              <div className="sa-stat-body">
                <span className="sa-stat-label">{label}</span>
                <span className="sa-stat-value" style={{ color }}>{value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sa-reports-grid">

          {/* Monthly trend chart */}
          <div className="sa-panel">
            <div className="sa-panel-header">
              <h3 className="sa-panel-title">Crecimiento mensual</h3>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                {[['#fbbf24', 'Locales'], ['#3b82f6', 'Usuarios']].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="sa-chart-area">
              {MONTHLY_DATA.map((d, i) => (
                <div key={i} className="sa-chart-col">
                  <div className="sa-chart-bars">
                    <div
                      className="sa-chart-bar"
                      style={{ height: `${(d.shops / maxShops) * 100}%`, background: 'linear-gradient(to top, #d97706, #fbbf24)' }}
                      title={`${d.shops} locales`}
                    />
                    <div
                      className="sa-chart-bar"
                      style={{ height: `${(d.users / maxUsers) * 100}%`, background: 'linear-gradient(to top, #1d4ed8, #3b82f6)' }}
                      title={`${d.users} usuarios`}
                    />
                  </div>
                  <span className="sa-chart-label">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-reports-side">

            {/* Category breakdown */}
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Tipos de negocio</h3>
              </div>
              <div className="sa-category-list">
                {Object.entries(catCount).map(([cat, count]) => {
                  const info = BUSINESS_CATEGORIES[cat as keyof typeof BUSINESS_CATEGORIES];
                  const pct  = shops.length > 0 ? Math.round((count / shops.length) * 100) : 0;
                  return (
                    <div key={cat} className="sa-category-item">
                      <div className="sa-category-row">
                        <span className="sa-category-name">{info?.emoji} {info?.label}</span>
                        <span className="sa-category-count">{count} ({pct}%)</span>
                      </div>
                      <div className="sa-category-track">
                        <div className="sa-category-bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role distribution */}
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Distribución de roles</h3>
              </div>
              <div className="sa-category-list">
                {Object.keys(ROLE_LABELS).map(role => {
                  const count = roleCount[role] ?? 0;
                  const pct   = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  const color = ROLE_COLORS[role];
                  return (
                    <div key={role} className="sa-category-item">
                      <div className="sa-category-row">
                        <span className="sa-category-name">{ROLE_LABELS[role]}</span>
                        <span style={{ color, fontSize: '0.85rem', fontWeight: 700 }}>{count}</span>
                      </div>
                      <div className="sa-category-track">
                        <div className="sa-category-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SuperAdminReportes;
