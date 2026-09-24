/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import * as firestore from 'firebase/firestore';

// Mock dependencias
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual as any,
    collection: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
  };
});

vi.mock('../services/firebase', () => ({
  db: {},
}));

vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Simulamos que onSnapshot no llama al callback aún
    vi.mocked(firestore.onSnapshot).mockImplementation(() => vi.fn());

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders empty state when no businesses exist', async () => {
    // Simulamos que onSnapshot devuelve un array vacío
    vi.mocked(firestore.onSnapshot).mockImplementation((_query, callback: any) => {
      callback({ docs: [] });
      return vi.fn(); // unsubscribe function
    });

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no hay locales registrados/i)).toBeInTheDocument();
  });

  it('renders KPIs and table when data is loaded', async () => {
    const mockShops = [
      { id: '1', data: () => ({ name: 'Barbería A', status: 'active', category: 'barbershop', expirationDate: '2026-12-31' }) },
    ];
    const mockUsers = [
      { id: 'u1', data: () => ({ name: 'Juan Perez' }) }
    ];

    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      // Mock rudimentario basado en si es colección 'businesses' o 'users'
      // Como collection es mockeado, verificamos qué se solicitó o simplemente llamamos al callback
      // Para este test, la primera llamada es businesses, la segunda users (según el componente)
      const callIndex = vi.mocked(firestore.onSnapshot).mock.calls.length;
      if (callIndex === 1) { // primera llamada
        callback({ docs: mockShops });
      } else { // segunda llamada
        callback({ docs: mockUsers });
      }
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });

    // KPI values
    expect(screen.getByText('Barbería A')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });
});
