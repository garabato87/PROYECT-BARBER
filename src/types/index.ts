export type BusinessCategory =
  | 'barberia'
  | 'peluqueria'
  | 'spa'
  | 'estetica'
  | 'unas'
  | 'pestanas'
  | 'maquillaje'
  | 'estilismo'
  | 'masajes'
  | 'otro';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  role: 'super-admin' | 'admin' | 'professional' | 'client';
  barbershopId?: string;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  status: 'active' | 'inactive';
  expirationDate: string;
  category: BusinessCategory;
}

// Alias para compatibilidad con código existente
export type Barbershop = Business;

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  barbershopId: string;
}

export interface Professional {
  id: string;
  name: string;
  photoURL?: string;
  barbershopId: string;
  specialty?: string;
  isActive?: boolean;
  schedule?: {
    day: string;
    start: string;
    end: string;
  }[];
}

export interface Appointment {
  id: string;
  clientId: string;
  barbershopId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'absent';
}

export interface AvailabilitySlot {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'absent';
}

export type AuditAction = 
  | 'USER_ROLE_PROMOTED'
  | 'USER_ROLE_DEMOTED'
  | 'USER_SUSPENDED'
  | 'BUSINESS_CREATED'
  | 'BUSINESS_SUSPENDED'
  | 'BUSINESS_REACTIVATED'
  | 'SUBSCRIPTION_RENEWED';

export interface AuditLog {
  id: string;
  timestamp: number;
  actor: {
    userId: string;
    email: string;
    role: string;
  };
  action: AuditAction;
  target: {
    entityId: string;
    entityType: 'USER' | 'BUSINESS' | 'SYSTEM';
    displayLabel: string;
  };
  details?: {
    reason?: string;
    previousState?: string | Record<string, unknown>;
    newState?: string | Record<string, unknown>;
  };
}
