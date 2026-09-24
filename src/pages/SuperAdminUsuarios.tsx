import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { logAuditActivity } from '../services/audit';
import Layout from '../components/Layout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { Crown, Shield, Briefcase, User as UserIcon, AlertTriangle, CheckCircle, Mail, Phone, Store } from 'lucide-react';
import type { User, Business } from '../types';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';

type Role = 'super-admin' | 'admin' | 'professional' | 'client';

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'super-admin':  { label: 'Super Admin',   color: 'text-accent',   bg: 'bg-accent/10',   icon: <Crown size={14} /> },
  'admin':        { label: 'Administrador', color: 'text-blue-500',    bg: 'bg-blue-500/10',    icon: <Shield size={14} /> },
  'professional': { label: 'Profesional',   color: 'text-success', bg: 'bg-success/10', icon: <Briefcase size={14} /> },
  'client':       { label: 'Cliente',       color: 'text-slate-400',   bg: 'bg-slate-400/10',   icon: <UserIcon size={14} /> },
};

const SuperAdminUsuarios: React.FC = () => {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Business[]>([]);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );
    const unsubShops = onSnapshot(collection(db, 'businesses'), 
      (snapshot) => {
        setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      },
      (error) => console.error('Error fetching shops:', error)
    );
    return () => {
      unsubUsers();
      unsubShops();
    };
  }, []);

  const getShopName = useCallback((shopId?: string) => {
    if (!shopId) return 'Ninguno';
    return shops.find(s => s.id === shopId)?.name ?? 'Desconocido';
  }, [shops]);

  const changeRole = useCallback(async (targetUser: User, newRole: Role) => {
    try {
      await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
      
      const isPromotion = 
        (newRole === 'super-admin') || 
        (newRole === 'admin' && targetUser.role !== 'super-admin');

      await logAuditActivity(
        isPromotion ? 'USER_ROLE_PROMOTED' : 'USER_ROLE_DEMOTED',
        {
          entityId: targetUser.id,
          entityType: 'USER',
          displayLabel: targetUser.email
        },
        {
          previousState: targetUser.role,
          newState: newRole
        }
      );
      
      success(`Rol actualizado a ${newRole}`);
    } catch (error) {
      console.error('Error changing role:', error);
      showError(getAppError(error), 'Error al cambiar el rol del usuario.');
    }
  }, [success, showError]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesText = (u.name || '').toLowerCase().includes(filter.toLowerCase()) || (u.email || '').toLowerCase().includes(filter.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesText && matchesRole;
    });
  }, [users, filter, roleFilter]);

  const roleCounts = useMemo(() => {
    return users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

  const columns: Column<User>[] = useMemo(() => [
    {
      header: 'Usuario',
      accessor: (u) => {
        const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG['client'];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${cfg.bg} ${cfg.color}`}>
              {(u.name || 'U').charAt(0).toUpperCase()}
            </div>
            <strong className="block text-sm font-bold text-foreground">{u.name || 'Usuario sin nombre'}</strong>
          </div>
        );
      }
    },
    {
      header: 'Email',
      accessor: (u) => <span className="text-sm text-text-secondary">{u.email}</span>
    },
    {
      header: 'Local asignado',
      accessor: (u) => <span className="text-sm text-text-secondary">{getShopName(u.barbershopId)}</span>
    },
    {
      header: 'Rol',
      accessor: (u) => {
        const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG['client'];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-current/20 ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (u) => (
        <button
          onClick={() => setSelectedUserId(u.id)}
          className="px-4 py-2 bg-background hover:bg-surface-hover border border-glass-border rounded-xl text-xs font-bold text-foreground transition-colors"
        >
          Administrar
        </button>
      )
    }
  ], [getShopName]);

  return (
    <Layout title="Gestión de Usuarios">
      <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-glass-border pb-8">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Panel Super Admin</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Gestión de <span className="text-accent">Usuarios</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Gestiona roles, accesos y revisa la actividad de todos los usuarios de la plataforma.
            </p>
          </div>
        </div>

        {/* Role Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(Object.keys(ROLE_CONFIG) as Role[]).map((role, i) => {
            const cfg = ROLE_CONFIG[role];
            return (
              <motion.div 
                key={role} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-glass-border rounded-2xl p-5 flex items-center gap-4 hover:bg-surface-hover transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{cfg.label}</span>
                  <span className={`text-2xl font-black leading-none ${cfg.color}`}>{roleCounts[role] ?? 0}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Data Table Filters & Component */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value as Role | 'all')}
            className="bg-background border border-glass-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none w-full sm:w-auto"
            aria-label="Filtrar por rol"
          >
            <option value="all">Todos los roles</option>
            <option value="super-admin">Super Admins</option>
            <option value="admin">Administradores</option>
            <option value="professional">Profesionales</option>
            <option value="client">Clientes</option>
          </select>
        </div>

        <DataTable
          data={filteredUsers}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Buscar por nombre o email..."
          searchValue={filter}
          onSearchChange={setFilter}
          isLoading={loading}
          emptyMessage="No se encontraron usuarios."
        />

        {/* Detail Drawer */}
        <Drawer
          isOpen={!!selectedUser}
          onClose={() => setSelectedUserId(null)}
          title="Administrar Usuario"
        >
          {selectedUser && (
            <UserDetails 
              user={selectedUser} 
              shopName={getShopName(selectedUser.barbershopId)}
              onChangeRole={changeRole}
            />
          )}
        </Drawer>
      </div>
    </Layout>
  );
};

// Componente extraído para mantener buenas prácticas de composición (evitar IIFE en JSX)
const UserDetails: React.FC<{ 
  user: User; 
  shopName: string;
  onChangeRole: (user: User, role: Role) => void;
}> = ({ user, shopName, onChangeRole }) => {
  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG['client'];

  return (
    <div className="flex flex-col gap-8">
      {/* User Header */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${cfg.bg} ${cfg.color}`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">{user.name}</h3>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-xs font-bold ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-background border border-glass-border p-3 rounded-xl">
          <Mail className="text-text-muted shrink-0" size={16} />
          <span className="text-sm text-foreground">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 bg-background border border-glass-border p-3 rounded-xl">
          <Phone className="text-text-muted shrink-0" size={16} />
          <span className="text-sm text-foreground">{user.phone || 'Teléfono no registrado'}</span>
        </div>
        {user.barbershopId && (
          <div className="flex items-center gap-3 bg-background border border-glass-border p-3 rounded-xl">
            <Store className="text-text-muted shrink-0" size={16} />
            <div>
              <p className="text-xs text-text-muted">Local asignado</p>
              <p className="text-sm text-foreground font-bold">{shopName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="border-glass-border" />

      {/* Role Management */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-4">Modificar Nivel de Acceso</h4>
        <div className="flex flex-col gap-2">
          {(Object.keys(ROLE_CONFIG) as Role[]).map(roleKey => {
            const roleCfg = ROLE_CONFIG[roleKey];
            const isCurrent = user.role === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => onChangeRole(user, roleKey)}
                disabled={isCurrent}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  isCurrent 
                    ? `border-current/30 ${roleCfg.bg} ${roleCfg.color} cursor-default`
                    : 'bg-background border-glass-border hover:border-foreground text-text-secondary hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${isCurrent ? 'bg-background/20' : 'bg-surface border border-glass-border'}`}>
                    {roleCfg.icon}
                  </div>
                  <span className="text-sm font-bold">{roleCfg.label}</span>
                </div>
                {isCurrent && <CheckCircle size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert */}
      {user.role === 'super-admin' && (
        <div className="mt-auto p-4 bg-accent/10 border border-amber-500/20 rounded-xl flex gap-3 text-accent">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-xs font-bold">
            Este usuario tiene privilegios totales en todo el sistema. Manejar con precaución.
          </p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsuarios;
