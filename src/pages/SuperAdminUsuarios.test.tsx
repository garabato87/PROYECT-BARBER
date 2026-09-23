/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminUsuarios from './SuperAdminUsuarios';
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

describe('SuperAdminUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Avoid triggering callbacks immediately
    vi.mocked(firestore.onSnapshot).mockImplementation(() => vi.fn());

    render(
      <MemoryRouter>
        <SuperAdminUsuarios />
      </MemoryRouter>
    );

    expect(screen.getByTestId('usuarios-loading')).toBeInTheDocument();
  });

  it('renders empty state when no users exist', async () => {
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      callback({ docs: [] });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminUsuarios />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('usuarios-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no hay usuarios registrados/i)).toBeInTheDocument();
  });

  it('renders users and handles text search', async () => {
    const mockUsers = [
      { id: 'u1', data: () => ({ name: 'Alice Smith', email: 'alice@test.com', role: 'admin' }) },
      { id: 'u2', data: () => ({ name: 'Bob Jones', email: 'bob@test.com', role: 'client' }) },
    ];
    
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      // Return mock data for both collections to satisfy the simple test
      callback({ docs: mockUsers });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminUsuarios />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    // Test text filter
    const searchInput = screen.getByPlaceholderText(/buscar usuario/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('allows filtering by role', async () => {
    const mockUsers = [
      { id: 'u1', data: () => ({ name: 'Alice Smith', email: 'alice@test.com', role: 'admin' }) },
      { id: 'u2', data: () => ({ name: 'Bob Jones', email: 'bob@test.com', role: 'client' }) },
    ];
    
    vi.mocked(firestore.onSnapshot).mockImplementation((_queryArgs: any, callback: any) => {
      callback({ docs: mockUsers });
      return vi.fn();
    });

    render(
      <MemoryRouter>
        <SuperAdminUsuarios />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // We expect a select element for roles
    const roleSelect = screen.getByTestId('role-filter');
    fireEvent.change(roleSelect, { target: { value: 'client' } });

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });
});
