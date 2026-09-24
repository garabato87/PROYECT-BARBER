import type { User, Business, Service, Professional, Appointment, Barbershop, BusinessCategory } from '../types';
import { BUSINESS_CATEGORIES } from '../constants/categories';

export { BUSINESS_CATEGORIES };
export type { User, Business, Service, Professional, Appointment, Barbershop, BusinessCategory };

export const mockUsers: User[] = [
  { id: '1', name: 'Alvaro SuperAdmin', email: 'admin@barber.com', phone: '123456', role: 'super-admin' },
  { id: '2', name: 'Barbero Juan', email: 'juan@barberia.com', phone: '654321', role: 'admin', barbershopId: 'b1' },
  { id: '3', name: 'Carlos Pro', email: 'carlos@barberia.com', phone: '987654', role: 'professional', barbershopId: 'b1' },
  { id: '4', name: 'Cliente Feliz', email: 'cliente@gmail.com', phone: '111222', role: 'client' },
];

export const mockBarbershops: Business[] = [
  {
    id: 'b1',
    name: 'La Gran Barbería',
    address: 'Calle Falsa 123',
    ownerId: '2',
    status: 'active',
    expirationDate: '2026-12-31',
    category: 'barberia',
  },
  {
    id: 'b2',
    name: 'Spa Serenidad',
    address: 'Av. Siempre Viva 742',
    ownerId: '5',
    status: 'inactive',
    expirationDate: '2026-01-01',
    category: 'spa',
  },
  {
    id: 'b3',
    name: 'Uñas & Estilo',
    address: 'Corrientes 1500',
    ownerId: '6',
    status: 'active',
    expirationDate: '2026-10-15',
    category: 'unas',
  },
];

export const mockServices: Service[] = [
  { id: 's1', name: 'Corte de Pelo', description: 'Corte clásico con tijera y máquina', price: 1500, duration: 30, barbershopId: 'b1' },
  { id: 's2', name: 'Barba', description: 'Perfilado y recorte de barba', price: 800, duration: 20, barbershopId: 'b1' },
  { id: 's3', name: 'Combo Completo', description: 'Corte + Barba + Lavado', price: 2000, duration: 50, barbershopId: 'b1' },
];

export const mockProfessionals: Professional[] = [
  {
    id: 'p1',
    name: 'Carlos Pro',
    barbershopId: 'b1',
    specialty: 'Degradados',
    schedule: [
      { day: 'Lunes', start: '09:00', end: '18:00' },
      { day: 'Martes', start: '09:00', end: '18:00' },
    ],
  },
  {
    id: 'p2',
    name: 'Luis Navaja',
    barbershopId: 'b1',
    specialty: 'Barbas',
    schedule: [
      { day: 'Miércoles', start: '10:00', end: '19:00' },
    ],
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    clientId: '4',
    barbershopId: 'b1',
    professionalId: 'p1',
    serviceId: 's1',
    date: '2026-05-10',
    startTime: '10:00',
    endTime: '10:30',
    status: 'pending',
  },
];
