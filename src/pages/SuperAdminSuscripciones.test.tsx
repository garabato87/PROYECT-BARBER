/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminSuscripciones from './SuperAdminSuscripciones';
import * as firestore from 'firebase/firestore';

// Mock Firebase dependencies
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

// Mock Layout to simplify DOM
vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

describe('SuperAdminSuscripciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(firestore.onSnapshot).mockImplementation(() => vi.fn());

    render(
      <MemoryRouter>
        <SuperAdminSuscripciones />
      </MemoryRouter>
    );

    expect(screen.getByTestId('suscripciones-loading')).toBeInTheDocument();
  });

  it('renders empty state when no shops exist', async () => {
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      callback({ docs: [] });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminSuscripciones />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('suscripciones-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no hay locales registrados/i)).toBeInTheDocument();
  });

  it('renders subscriptions data', async () => {
    const mockShops = [
      { id: 's1', data: () => ({ name: 'Barber Test', ownerId: 'u1', category: 'barbershop', status: 'active', expirationDate: '2050-12-31' }) }
    ];
    
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      callback({ docs: mockShops });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminSuscripciones />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Barber Test')).toBeInTheDocument();
      expect(screen.queryByTestId('suscripciones-loading')).not.toBeInTheDocument();
    });
  });
});
