import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { BUSINESS_CATEGORIES } from '../mocks/db';
import type { Business, User } from '../types';
import { MapPin, Mail, User as UserIcon, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import { logAuditActivity } from '../services/audit';

const SuperAdminLocales: React.FC = () => {
  const { success, error: showError } = useToast();
  const [shops, setShops] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  
  const selectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, 'businesses'), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
        setShops(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching shops:', error);
        showError(getAppError(error), 'Error al cargar locales');
        setLoading(false);
      }
    );
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(data);
    });

    return () => {
      unsubShops();
      unsubUsers();
    };
  }, [showError]);

  const getOwner = (ownerId: string) => users.find(u => u.id === ownerId);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'businesses', id), { status: newStatus });
      
      const shopName = shops.find(s => s.id === id)?.name || 'Local Desconocido';
      await logAuditActivity(
        newStatus === 'active' ? 'BUSINESS_REACTIVATED' : 'BUSINESS_SUSPENDED',
        { entityId: id, entityType: 'BUSINESS', displayLabel: shopName },
        { previousState: currentStatus, newState: newStatus }
      );
      success(`Local ${newStatus === 'active' ? 'activado' : 'suspendido'}`);
    } catch (error) {
      console.error('Error toggling status:', error);
      showError(getAppError(error), 'Error al cambiar el estado del local.');
    }
  };

  const filteredShops = useMemo(() => {
    return shops.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
    );
  }, [shops, search]);

  const columns: Column<Business>[] = useMemo(() => [
    {
      header: 'Local',
      accessor: (shop) => {
        const cat = BUSINESS_CATEGORIES[shop.category];
        return (
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0 bg-background border border-glass-border p-2 rounded-xl text-accent">{cat?.icon}</span>
            <div>
              <strong className="block text-sm font-bold text-foreground">{shop.name}</strong>
              <span className="block text-xs text-text-muted mt-0.5 max-w-[200px] truncate" title={shop.address}>{shop.address}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Responsable',
      accessor: (shop) => {
        const owner = getOwner(shop.ownerId);
        return (
          <div>
            <span className="block text-sm text-foreground">{owner?.name || 'Desconocido'}</span>
            <span className="block text-xs text-text-muted">{owner?.email || 'Sin email'}</span>
          </div>
        );
      }
    },
    {
      header: 'Vencimiento',
      accessor: 'expirationDate'
    },
    {
      header: 'Estado',
      accessor: (shop) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
          shop.status === 'active' 
            ? 'bg-success/10 text-success border-success/20' 
            : 'bg-danger/10 text-danger border-danger/20'
        }`}>
          {shop.status === 'active' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
          {shop.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (shop) => (
        <button
          onClick={() => setSelectedShopId(shop.id)}
          className="px-4 py-2 bg-background hover:bg-surface-hover border border-glass-border rounded-xl text-xs font-bold text-foreground transition-colors"
        >
          Administrar
        </button>
      )
    }
  ], [users]);

  return (
    <Layout title="Gestión de Locales">
      <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Panel Super Admin</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Gestión de <span className="text-accent">Locales</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Administra todos los negocios de la plataforma, revisa su estado, suscripciones y dueños.
            </p>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredShops}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Buscar por nombre o dirección..."
          searchValue={search}
          onSearchChange={setSearch}
          isLoading={loading}
          emptyMessage="No se encontraron locales."
        />

        {/* Detail Drawer */}
        <Drawer
          isOpen={!!selectedShop}
          onClose={() => setSelectedShopId(null)}
          title="Detalles del Local"
        >
          {selectedShop && (
            <ShopDetails 
              shop={selectedShop} 
              owner={getOwner(selectedShop.ownerId)} 
              onToggleStatus={toggleStatus} 
            />
          )}
        </Drawer>
      </div>
    </Layout>
  );
};

// Extracted component to improve readability and avoid inline IIFE in JSX
const ShopDetails: React.FC<{ 
  shop: Business; 
  owner?: User; 
  onToggleStatus: (id: string, status: string) => void;
}> = ({ shop, owner, onToggleStatus }) => {
  const cat = BUSINESS_CATEGORIES[shop.category];
  const isActive = shop.status === 'active';

  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-glass-border flex items-center justify-center text-accent shadow-sm">
          {cat?.icon}
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">{shop.name}</h3>
          <p className="text-sm text-text-secondary">{cat?.label}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-4 rounded-xl border ${isActive ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {isActive ? <CheckCircle className="text-success" /> : <AlertTriangle className="text-danger" />}
          <div>
            <p className="text-sm font-bold text-foreground">Estado de la cuenta</p>
            <p className="text-xs text-text-muted">{isActive ? 'Operando normalmente' : 'Suspendido / Vencido'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isActive 
            ? 'bg-success/10 text-success border-success/20' 
            : 'bg-danger/10 text-danger border-danger/20'
        }`}>
          {isActive ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </div>

      {/* Detailed Info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <MapPin className="text-text-muted mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">Dirección</p>
            <p className="text-sm text-foreground">{shop.address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar className="text-text-muted mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">Vencimiento Suscripción</p>
            <p className="text-sm text-foreground">{shop.expirationDate}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-glass-border" />

      {/* Owner Info */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-4">Información del Responsable</h4>
        <div className="bg-background border border-glass-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <UserIcon className="text-text-muted" size={16} />
            <span className="text-sm text-foreground">{owner?.name || 'Usuario desconocido'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-text-muted" size={16} />
            <span className="text-sm text-foreground">{owner?.email || 'Sin correo'}</span>
          </div>
        </div>
      </div>

      {/* Dangerous Actions */}
      <div className="pt-4 mt-auto">
        <button
          onClick={() => onToggleStatus(shop.id, shop.status)}
          className={`w-full py-3 rounded-xl font-bold transition-colors border ${
            isActive 
              ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/10 hover:text-danger'
              : 'bg-success/10 text-success border-success/20 hover:bg-success/10 hover:text-success'
          }`}
        >
          {isActive ? 'Suspender Local' : 'Reactivar Local'}
        </button>
        <p className="text-center text-xs text-text-muted mt-3">
          {isActive 
            ? 'Suspender el local ocultará el negocio del sistema de reservas para los clientes.' 
            : 'Reactivar el local permitirá que reciba reservas nuevamente.'}
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLocales;
