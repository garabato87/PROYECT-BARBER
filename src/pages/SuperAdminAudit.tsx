import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import Layout from '../components/Layout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import type { AuditLog } from '../types';
import { ShieldAlert, User, Store } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  USER_ROLE_PROMOTED: 'Ascenso de Rol',
  USER_ROLE_DEMOTED: 'Descenso de Rol',
  USER_SUSPENDED: 'Usuario Suspendido',
  BUSINESS_CREATED: 'Local Creado',
  BUSINESS_SUSPENDED: 'Local Suspendido',
  BUSINESS_REACTIVATED: 'Local Reactivado',
  SUBSCRIPTION_RENEWED: 'Suscripción Renovada',
};

const SuperAdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.actor.email.toLowerCase().includes(search.toLowerCase()) ||
      log.target.displayLabel.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  const columns: Column<AuditLog>[] = useMemo(() => [
    {
      header: 'Fecha',
      accessor: (log) => {
        // Handle both JS numbers and Firestore Timestamp objects
        const dateObj = typeof log.timestamp === 'number' 
          ? new Date(log.timestamp) 
          : (log.timestamp as any)?.toDate?.() || new Date();
        return <span className="text-sm font-bold text-foreground">{dateObj.toLocaleString()}</span>;
      }
    },
    {
      header: 'Actor',
      accessor: (log) => (
        <div>
          <strong className="block text-sm text-foreground">{log.actor.email}</strong>
          <span className="text-xs text-text-muted">{log.actor.role}</span>
        </div>
      )
    },
    {
      header: 'Acción',
      accessor: (log) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
          <ShieldAlert size={12} />
          {ACTION_LABELS[log.action] || log.action}
        </span>
      )
    },
    {
      header: 'Objetivo',
      accessor: (log) => (
        <div className="flex items-center gap-2">
          {log.target.entityType === 'USER' ? <User size={14} className="text-text-muted" /> : <Store size={14} className="text-text-muted" />}
          <span className="text-sm font-bold text-foreground">{log.target.displayLabel}</span>
        </div>
      )
    },
    {
      header: 'Detalles',
      accessor: (log) => {
        if (!log.details) return <span className="text-text-muted text-xs">—</span>;
        return (
          <div className="text-xs text-text-secondary">
            {log.details.reason && <p><strong>Motivo:</strong> {log.details.reason}</p>}
            {log.details.previousState && <p><strong>Prev:</strong> {String(log.details.previousState)}</p>}
            {log.details.newState && <p><strong>Nuevo:</strong> {String(log.details.newState)}</p>}
          </div>
        );
      }
    }
  ], []);

  return (
    <Layout title="Registro de Auditoría">
      <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-glass-border pb-8">
          <div>
            <p className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Seguridad</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
              Registro de <span className="text-accent">Auditoría</span>
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Historial inmutable de acciones críticas de administradores.
            </p>
          </div>
        </div>

        <DataTable
          data={filteredLogs}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Buscar por email o local..."
          searchValue={search}
          onSearchChange={setSearch}
          isLoading={loading}
          emptyMessage="No se encontraron registros de auditoría."
        />
      </div>
    </Layout>
  );
};

export default SuperAdminAudit;
