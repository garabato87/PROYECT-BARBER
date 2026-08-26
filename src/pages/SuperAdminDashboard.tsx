import React, { useState, useMemo } from 'react';
import { BUSINESS_CATEGORIES } from '../mocks/db';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, getDocs, query } from 'firebase/firestore';
import Layout from '../components/Layout';
import { Store, Users, CheckCircle, AlertTriangle, Search, Plus } from 'lucide-react';
import './SuperAdmin.css';

const EXPIRY_WARNING_DAYS = 90;

const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const SuperAdminDashboard: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Listen to businesses
    const unsubShops = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(data);
      setLoading(false);
    });
    
    // Fetch users (since it's not expected to change super rapidly for KPIs, getDocs is fine, or onSnapshot)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error al cambiar el estado.');
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
    { label: 'Total Locales',          value: shops.length,   icon: Store,          accent: '#fbbf24' },
    { label: 'Suscripciones Activas',  value: activeCount,    icon: CheckCircle,    accent: '#10b981' },
    { label: 'Inactivas / Vencidas',   value: inactiveCount,  icon: AlertTriangle,  accent: '#ef4444' },
    { label: 'Usuarios Registrados',   value: users.length, icon: Users,        accent: '#3b82f6' },
  ];

  return (
    <Layout title="Panel Super Admin">
      <div className="sa-root animate-slide-up">

        {/* Header */}
        <div className="sa-header">
          <div>
            <p className="sa-header-eyebrow">Sistema de Gestión de Peluquerías</p>
            <h1 className="sa-header-title">Panel de <span>Control</span></h1>
            <p className="sa-header-sub">
              Supervisá el estado de todos los locales registrados en la plataforma.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="sa-stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="sa-stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="sa-stat-icon" style={{ background: `${stat.accent}18`, color: stat.accent }}>
                <stat.icon size={22} />
              </div>
              <div className="sa-stat-body">
                <span className="sa-stat-label">{stat.label}</span>
                <span className="sa-stat-value" style={{ color: stat.accent }}>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <div className="sa-alert-strip">
            <AlertTriangle size={15} />
            <span>
              <strong>{expiringSoon.length}</strong>{' '}
              {expiringSoon.length === 1 ? 'local vence' : 'locales vencen'} en los próximos {EXPIRY_WARNING_DAYS} días:
            </span>
            {expiringSoon.map(s => (
              <span key={s.id} className="sa-alert-tag">
                {s.name} · {daysUntil(s.expirationDate)}d
              </span>
            ))}
          </div>
        )}

        {/* Main Grid */}
        <div className="sa-main-grid">

          {/* Shops Table */}
          <div className="sa-panel sa-table-panel">
            <div className="sa-panel-header">
              <h3 className="sa-panel-title">Locales registrados</h3>
              <div className="sa-search-box">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Buscar local..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Local</th>
                    <th>Responsable</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(shop => {
                    const days = daysUntil(shop.expirationDate);
                    const warning = days >= 0 && days <= EXPIRY_WARNING_DAYS && shop.status === 'active';
                    const cat = BUSINESS_CATEGORIES[shop.category];
                    return (
                      <tr key={shop.id} className={warning ? 'sa-row-warning' : ''}>
                        <td>
                          <div className="sa-shop-cell">
                            <span className="sa-shop-emoji">{cat?.emoji}</span>
                            <div>
                              <strong>{shop.name}</strong>
                              <p className="sa-shop-address">{shop.address}</p>
                            </div>
                          </div>
                        </td>
                        <td>{getOwnerName(shop.ownerId)}</td>
                        <td>
                          {warning ? (
                            <span className="sa-date-warning">
                              {shop.expirationDate}
                              <span className="sa-days-badge">{days}d</span>
                            </span>
                          ) : (
                            <span className="sa-date">{shop.expirationDate}</span>
                          )}
                        </td>
                        <td>
                          <span className={`sa-status-pill ${shop.status}`}>
                            {shop.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="sa-row-actions">
                            <button
                              className={`sa-action-btn ${shop.status === 'active' ? 'danger' : 'success'}`}
                              onClick={() => toggleStatus(shop.id, shop.status)}
                            >
                              {shop.status === 'active' ? 'Suspender' : 'Activar'}
                            </button>
                            <button className="sa-action-btn">Editar</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panels */}
          <div className="sa-side">

            {/* Category Breakdown */}
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Tipos de negocio</h3>
              </div>
              <div className="sa-category-list">
                {categoryBreakdown.map(({ cat, count, info, pct }) => (
                  <div key={cat} className="sa-category-item">
                    <div className="sa-category-row">
                      <span className="sa-category-name">{info?.emoji} {info?.label}</span>
                      <span className="sa-category-count">{count}</span>
                    </div>
                    <div className="sa-category-track">
                      <div className="sa-category-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Estado del sistema</h3>
              </div>
              <div className="sa-health-rows">
                <div className="sa-health-row">
                  <span>Tasa de activación</span>
                  <span className="sa-health-value" style={{ color: '#10b981' }}>
                    {shops.length > 0 ? Math.round((activeCount / shops.length) * 100) : 0}%
                  </span>
                </div>
                <div className="sa-health-row">
                  <span>Suscripciones en riesgo</span>
                  <span className="sa-health-value" style={{ color: expiringSoon.length > 0 ? '#f59e0b' : '#10b981' }}>
                    {expiringSoon.length > 0 ? `${expiringSoon.length} alerta${expiringSoon.length > 1 ? 's' : ''}` : 'Sin alertas'}
                  </span>
                </div>
                <div className="sa-health-row">
                  <span>Usuarios por local</span>
                  <span className="sa-health-value">
                    {shops.length > 0 ? (users.length / shops.length).toFixed(1) : '—'}
                  </span>
                </div>
                <div className="sa-health-row">
                  <span>Categorías distintas</span>
                  <span className="sa-health-value">{categoryBreakdown.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
