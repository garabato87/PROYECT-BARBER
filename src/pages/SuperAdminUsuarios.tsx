import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { Search, Plus, Crown, Shield, Briefcase, User } from 'lucide-react';
import './SuperAdmin.css';

type Role = 'super-admin' | 'admin' | 'professional' | 'client';

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  'super-admin':  { label: 'Super Admin',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  'admin':        { label: 'Administrador', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  'professional': { label: 'Profesional',   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  'client':       { label: 'Cliente',       color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  'super-admin':  <Crown size={12} />,
  'admin':        <Shield size={12} />,
  'professional': <Briefcase size={12} />,
  'client':       <User size={12} />,
};

const SuperAdminUsuarios: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubShops = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubUsers();
      unsubShops();
    };
  }, []);

  const getShopName = (shopId?: string) =>
    shopId ? shops.find(b => b.id === shopId)?.name ?? '—' : '—';

  const changeRole = async (userId: string, newRole: Role) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setChangingRole(null);
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Error al cambiar el rol del usuario.');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout title="Usuarios">
      <div className="sa-root animate-slide-up">

        {/* Header */}
        <div className="sa-header">
          <div>
            <p className="sa-header-eyebrow">Gestión de usuarios</p>
            <h1 className="sa-header-title">Usuarios <span>registrados</span></h1>
            <p className="sa-header-sub">Gestioná roles y accesos de todos los usuarios de la plataforma.</p>
          </div>
          <button className="sa-add-btn">
            <Plus size={18} /> Invitar usuario
          </button>
        </div>

        {/* Role summary */}
        <div className="sa-stats-grid">
          {(Object.keys(ROLE_CONFIG) as Role[]).map((role, i) => {
            const cfg = ROLE_CONFIG[role];
            return (
              <div key={role} className="sa-stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="sa-stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
                  {ROLE_ICONS[role]}
                </div>
                <div className="sa-stat-body">
                  <span className="sa-stat-label">{cfg.label}</span>
                  <span className="sa-stat-value" style={{ color: cfg.color }}>{roleCounts[role] ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="sa-panel">
          <div className="sa-panel-header">
            <h3 className="sa-panel-title">Todos los usuarios ({filtered.length})</h3>
            <div className="sa-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Local asignado</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const cfg = ROLE_CONFIG[u.role];
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="sa-user-cell">
                          <div className="sa-user-avatar" style={{ background: cfg.bg, color: cfg.color }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <strong style={{ color: '#f8fafc' }}>{u.name}</strong>
                        </div>
                      </td>
                      <td className="sa-cell-muted">{u.email}</td>
                      <td className="sa-cell-muted">{u.phone || '—'}</td>
                      <td className="sa-cell-muted">{getShopName(u.barbershopId)}</td>
                      <td>
                        <span
                          className="sa-role-pill"
                          style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}
                        >
                          {ROLE_ICONS[u.role]}
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        {changingRole === u.id ? (
                          <div className="sa-role-selector">
                            {(Object.keys(ROLE_CONFIG) as Role[]).map(role => (
                              <button
                                key={role}
                                className="sa-role-option"
                                style={{ color: ROLE_CONFIG[role].color }}
                                onClick={() => changeRole(u.id, role)}
                              >
                                {ROLE_CONFIG[role].label}
                              </button>
                            ))}
                            <button className="sa-role-option sa-role-cancel" onClick={() => setChangingRole(null)}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button className="sa-action-btn" onClick={() => setChangingRole(u.id)}>
                            Cambiar rol
                          </button>
                        )}
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

export default SuperAdminUsuarios;
