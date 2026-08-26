import React, { useState } from 'react';
import { BUSINESS_CATEGORIES } from '../mocks/db';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import './SuperAdmin.css';

const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const DaysBar: React.FC<{ days: number }> = ({ days }) => {
  if (days < 0) {
    return <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700 }}>Vencida</span>;
  }
  const pct = Math.min((days / 365) * 100, 100);
  const color = days <= 30 ? '#ef4444' : days <= 90 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{ width: '72px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '0.82rem', color, fontWeight: 600 }}>{days}d</span>
    </div>
  );
};

const SuperAdminSuscripciones: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});

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

  const getOwnerName = (ownerId: string) =>
    users.find(u => u.id === ownerId)?.name ?? 'Desconocido';

  const renovar = async (id: string, currentDate: string) => {
    const months = selectedMonths[id] || 1; // Default 1 mes
    try {
      const newDate = addMonths(currentDate, months);
      await updateDoc(doc(db, 'businesses', id), { 
        expirationDate: newDate, 
        status: 'active' 
      });
      alert(`Suscripción renovada por ${months} mes(es).`);
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      alert('Error al renovar la suscripción.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'businesses', id), { status: newStatus });
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error al cambiar el estado.');
    }
  };

  const active   = shops.filter(s => s.status === 'active').length;
  const inactive = shops.filter(s => s.status === 'inactive').length;
  const expiring = shops.filter(s => { const d = daysUntil(s.expirationDate); return d >= 0 && d <= 90 && s.status === 'active'; }).length;
  const expired  = shops.filter(s => daysUntil(s.expirationDate) < 0).length;

  const stats = [
    { label: 'Activas',          value: active,   color: '#10b981', Icon: CheckCircle },
    { label: 'Inactivas',        value: inactive, color: '#ef4444', Icon: XCircle     },
    { label: 'Por vencer (90d)', value: expiring, color: '#f59e0b', Icon: AlertTriangle },
    { label: 'Vencidas',         value: expired,  color: '#6b7280', Icon: Calendar    },
  ];

  return (
    <Layout title="Suscripciones">
      <div className="sa-root animate-slide-up">

        {/* Header */}
        <div className="sa-header">
          <div>
            <p className="sa-header-eyebrow">Gestión de suscripciones</p>
            <h1 className="sa-header-title">Estado de <span>suscripciones</span></h1>
            <p className="sa-header-sub">Controlá los vencimientos y renovaciones de todos los locales.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="sa-stats-grid">
          {stats.map(({ label, value, color, Icon }, i) => (
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

        {/* Table */}
        <div className="sa-panel">
          <div className="sa-panel-header">
            <h3 className="sa-panel-title">Todos los locales</h3>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Responsable</th>
                  <th>Vencimiento</th>
                  <th>Tiempo restante</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => {
                  const days = daysUntil(shop.expirationDate);
                  const cat  = BUSINESS_CATEGORIES[shop.category];
                  const warn = days >= 0 && days <= 90 && shop.status === 'active';

                  return (
                    <tr key={shop.id} className={warn ? 'sa-row-warning' : ''}>
                      <td>
                        <div className="sa-shop-cell">
                          <span className="sa-shop-emoji">{cat?.emoji}</span>
                          <div>
                            <strong style={{ color: '#f8fafc' }}>{shop.name}</strong>
                            <p className="sa-shop-address">{shop.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="sa-cell-muted">{getOwnerName(shop.ownerId)}</td>
                      <td>
                        <span className={days < 0 || warn ? 'sa-date-warning' : 'sa-date'}>
                          {shop.expirationDate}
                        </span>
                      </td>
                      <td><DaysBar days={days} /></td>
                      <td>
                        <span className={`sa-status-pill ${shop.status}`}>
                          {shop.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="sa-row-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select 
                            className="sa-input" 
                            style={{ padding: '0.3rem 0.5rem', width: '90px' }}
                            value={selectedMonths[shop.id] || 1}
                            onChange={(e) => setSelectedMonths(prev => ({ ...prev, [shop.id]: parseInt(e.target.value) }))}
                          >
                            <option value={1}>1 Mes</option>
                            <option value={3}>3 Meses</option>
                            <option value={6}>6 Meses</option>
                            <option value={12}>1 Año</option>
                          </select>
                          <button className="sa-action-btn success" onClick={() => renovar(shop.id, shop.expirationDate)}>
                            Renovar
                          </button>
                          <button
                            className={`sa-action-btn ${shop.status === 'active' ? 'danger' : ''}`}
                            onClick={() => toggleStatus(shop.id, shop.status)}
                          >
                            {shop.status === 'active' ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SuperAdminSuscripciones;
