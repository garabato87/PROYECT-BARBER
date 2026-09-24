import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { logAuditActivity } from '../services/audit';
import Layout from '../components/Layout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { CheckCircle, XCircle, AlertTriangle, Calendar, Clock, CreditCard, Check, X, Store } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '../constants/categories';
import type { Business, User, BusinessCategory } from '../types';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';

const daysUntil = (dateStr?: string) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

const addMonths = (dateStr: string, months: number) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const DaysBar: React.FC<{ days: number }> = ({ days }) => {
  if (days < 0) {
    return <span className="text-danger text-xs font-bold">Vencida</span>;
  }
  const pct = Math.min((days / 365) * 100, 100);
  const color = days <= 30 ? 'bg-danger' : days <= 90 ? 'bg-accent' : 'bg-success';
  const textColor = days <= 30 ? 'text-danger' : days <= 90 ? 'text-accent' : 'text-success';
  
  return (
    <div 
      className="flex items-center gap-2.5 w-[120px]"
      role="progressbar"
      aria-label="Días restantes de suscripción"
      aria-valuenow={Math.max(0, days)}
      aria-valuemin={0}
      aria-valuemax={365}
    >
      <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${textColor}`}>{days}d</span>
    </div>
  );
};

const SuperAdminSuscripciones: React.FC = () => {
  const { success, error: showError } = useToast();
  const [shops, setShops] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const selectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, 'businesses'), 
      (snapshot) => {
        setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching shops:', error);
        setLoading(false);
      }
    );
    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      },
      (error) => console.error('Error fetching users:', error)
    );
    return () => {
      unsubShops();
      unsubUsers();
    };
  }, []);

  const getOwnerName = useCallback((ownerId: string) => {
    return users.find(u => u.id === ownerId)?.name ?? 'Desconocido';
  }, [users]);

  const renovar = useCallback(async (id: string, currentDate: string, months: number) => {
    try {
      const newDate = addMonths(currentDate, months);
      await updateDoc(doc(db, 'businesses', id), { 
        expirationDate: newDate, 
        status: 'active' 
      });

      const shopName = shops.find(s => s.id === id)?.name || 'Local Desconocido';
      await logAuditActivity(
        'SUBSCRIPTION_RENEWED',
        { entityId: id, entityType: 'BUSINESS', displayLabel: shopName },
        { previousState: currentDate, newState: newDate, reason: `Renovación por ${months} meses` }
      );

      success(`Suscripción renovada por ${months} mes(es).`);
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      showError(getAppError(error), 'Error al renovar la suscripción.');
    }
  }, [shops, success, showError]);

  const toggleStatus = useCallback(async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'businesses', id), { status: newStatus });

      const shopName = shops.find(s => s.id === id)?.name || 'Local Desconocido';
      await logAuditActivity(
        newStatus === 'active' ? 'BUSINESS_REACTIVATED' : 'BUSINESS_SUSPENDED',
        { entityId: id, entityType: 'BUSINESS', displayLabel: shopName },
        { previousState: currentStatus, newState: newStatus }
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      showError(getAppError(error), 'Error al cambiar el estado.');
    }
  }, [shops, showError]);

  const handleBulkAction = async (newStatus: 'active' | 'inactive') => {
    if (!window.confirm(`¿Seguro que deseas marcar ${selectedKeys.length} locales como ${newStatus}?`)) return;
    
    try {
      const batch = writeBatch(db);
      const actionName = newStatus === 'active' ? 'BUSINESS_REACTIVATED' : 'BUSINESS_SUSPENDED';

      for (const id of selectedKeys) {
        const shop = shops.find(s => s.id === id);
        if (!shop || shop.status === newStatus) continue;

        const shopRef = doc(db, 'businesses', id);
        batch.update(shopRef, { status: newStatus });
        
        await logAuditActivity(
          actionName,
          { entityId: id, entityType: 'BUSINESS', displayLabel: shop.name },
          { previousState: shop.status, newState: newStatus, reason: 'Acción masiva' }
        );
      }

      await batch.commit();
      setSelectedKeys([]);
      success(`Locales actualizados a ${newStatus}.`);
    } catch (error) {
      console.error('Error en bulk action:', error);
      showError(getAppError(error), 'Error al ejecutar acción masiva.');
    }
  };

  const filteredShops = useMemo(() => {
    return shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [shops, search]);

  const stats = useMemo(() => {
    const active   = shops.filter(s => s.status === 'active').length;
    const inactive = shops.filter(s => s.status === 'inactive').length;
    const expiring = shops.filter(s => { const d = daysUntil(s.expirationDate); return d >= 0 && d <= 90 && s.status === 'active'; }).length;
    const expired  = shops.filter(s => daysUntil(s.expirationDate) < 0).length;

    return [
      { label: 'Activas',          value: active,   color: 'text-success', bg: 'bg-success/10', Icon: CheckCircle },
      { label: 'Inactivas',        value: inactive, color: 'text-danger',     bg: 'bg-danger/10',     Icon: XCircle     },
      { label: 'Por vencer (90d)', value: expiring, color: 'text-accent',   bg: 'bg-accent/10',   Icon: AlertTriangle },
      { label: 'Vencidas',         value: expired,  color: 'text-slate-400',   bg: 'bg-slate-400/10',   Icon: Calendar    },
    ];
  }, [shops]);

  const columns: Column<Business>[] = useMemo(() => [
    {
      header: 'Local',
      accessor: (shop) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold">
            {BUSINESS_CATEGORIES[shop.category as BusinessCategory]?.icon || <Store size={18} />}
          </div>
          <div>
            <strong className="block text-sm text-foreground">{shop.name}</strong>
            <span className="text-xs text-text-muted">{getOwnerName(shop.ownerId)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Vencimiento',
      accessor: (shop) => {
        const d = new Date(shop.expirationDate).toLocaleDateString();
        return (
          <div>
            <span className="block text-sm text-foreground">{d}</span>
            <DaysBar days={daysUntil(shop.expirationDate)} />
          </div>
        );
      }
    },
    {
      header: 'Estado',
      accessor: (shop) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          shop.status === 'active' 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-danger/10 text-danger border border-danger/20'
        }`}>
          {shop.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {shop.status === 'active' ? 'Activa' : 'Suspendida'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (shop) => (
        <button
          onClick={() => setSelectedShopId(shop.id)}
          aria-label={`Gestionar ${shop.name}`}
          className="text-xs font-bold text-accent hover:text-accent-hover transition-colors px-3 py-1.5 rounded-lg border border-accent/20 hover:border-accent/40 bg-accent/5"
        >
          Gestionar
        </button>
      )
    }
  ], [getOwnerName]);

  const bulkActions = (
    <>
      <button 
        onClick={() => handleBulkAction('active')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs font-bold hover:bg-success/30 transition-colors"
      >
        <Check size={14} /> Activar
      </button>
      <button 
        onClick={() => handleBulkAction('inactive')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-xs font-bold hover:bg-danger/30 transition-colors"
      >
        <X size={14} /> Suspender
      </button>
    </>
  );

  return (
    <Layout title="Gestión de Suscripciones">
      <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-glass-border pb-8">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Facturación</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Gestión de <span className="text-accent">Suscripciones</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Controla vencimientos, renueva planes y suspende locales con pagos atrasados.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
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

        {/* Data Table */}
        <DataTable
          data={filteredShops}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Buscar local por nombre..."
          searchValue={search}
          onSearchChange={setSearch}
          isLoading={loading}
          emptyMessage="No se encontraron locales."
          selectable={true}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          bulkActions={bulkActions}
        />

        {/* Detail Drawer */}
        <Drawer
          isOpen={!!selectedShop}
          onClose={() => setSelectedShopId(null)}
          title="Renovación y Estado"
        >
          {selectedShop && (
            <SubscriptionDetails 
              key={selectedShop.id}
              shop={selectedShop} 
              onRenovar={renovar}
              onToggleStatus={toggleStatus}
            />
          )}
        </Drawer>
      </div>
    </Layout>
  );
};

const SubscriptionDetails: React.FC<{
  shop: Business;
  onRenovar: (id: string, date: string, months: number) => void;
  onToggleStatus: (id: string, status: string) => void;
}> = ({ shop, onRenovar, onToggleStatus }) => {
  const [monthsToRenew, setMonthsToRenew] = useState<number>(1);
  const days = daysUntil(shop.expirationDate);
  const isActive = shop.status === 'active';
  const isExpired = days < 0;
  
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black text-foreground">{shop.name}</h3>
        <p className="text-sm text-text-secondary mt-1">Gestión financiera y operativa</p>
      </div>

      {/* Subscription Card */}
      <div className={`p-5 rounded-2xl border ${isExpired ? 'bg-danger/10 border-danger/20' : 'bg-surface border-glass-border'} flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={isExpired ? 'text-danger' : 'text-accent'} size={20} />
            <span className="text-sm font-bold text-foreground">Tiempo Restante</span>
          </div>
          <DaysBar days={days} />
        </div>
        <hr className={`border-${isExpired ? 'red-500/20' : 'glass-border'}`} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className={isExpired ? 'text-danger' : 'text-text-muted'} size={20} />
            <span className="text-sm font-bold text-foreground">Fecha Vencimiento</span>
          </div>
          <span className={`text-sm font-black ${isExpired ? 'text-danger' : 'text-foreground'}`}>{shop.expirationDate}</span>
        </div>
      </div>

      {/* Renew Form */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-4">Renovar Suscripción</h4>
        <div className="flex gap-3">
          <select 
            value={monthsToRenew} 
            onChange={(e) => setMonthsToRenew(parseInt(e.target.value))}
            className="bg-background border border-glass-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-accent outline-none flex-1"
            aria-label="Seleccionar meses a renovar"
          >
            <option value={1}>1 Mes</option>
            <option value={3}>3 Meses</option>
            <option value={6}>6 Meses</option>
            <option value={12}>1 Año</option>
          </select>
          <button 
            onClick={() => onRenovar(shop.id, shop.expirationDate, monthsToRenew)}
            className="bg-accent hover:bg-accent/90 text-on-primary font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CreditCard size={18} />
            Pagar
          </button>
        </div>
      </div>

      {/* Status Toggle */}
      <div className="pt-8 mt-auto border-t border-glass-border">
        <h4 className="text-sm font-bold text-foreground mb-4">Estado Operativo</h4>
        <button
          onClick={() => onToggleStatus(shop.id, shop.status)}
          className={`w-full py-3 rounded-xl font-bold transition-colors border ${
            isActive 
              ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white'
              : 'bg-success/10 text-success border-success/20 hover:bg-success hover:text-white'
          }`}
        >
          {isActive ? 'Suspender Operaciones' : 'Reactivar Local'}
        </button>
        <p className="text-center text-xs text-text-muted mt-3">
          {isActive 
            ? 'Suspender el local no afecta la fecha de vencimiento.' 
            : 'Reactivar permitirá reservas y transacciones normales.'}
        </p>
      </div>
    </div>
  );
};

export default SuperAdminSuscripciones;
