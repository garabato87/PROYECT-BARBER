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
