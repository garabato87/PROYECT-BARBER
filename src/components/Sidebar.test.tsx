import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import * as authHook from '../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar Component - Admin Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );
  };

  it('renders super-admin navigation items when role is super-admin', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '1', name: 'Goku', email: 'goku@dbz.com', phone: '', role: 'super-admin' },
      isAuthenticated: true,
      isLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    renderSidebar();

    // Verificamos que se rendericen los enlaces de super-admin
    expect(screen.getByText(/resumen global/i)).toBeInTheDocument();
    expect(screen.getByText(/usuarios/i)).toBeInTheDocument();
    expect(screen.getByText(/suscripciones/i)).toBeInTheDocument();
    expect(screen.getByText(/reportes/i)).toBeInTheDocument();

    // Verificamos que NO se rendericen los de otros roles (ej. Mi Local)
    expect(screen.queryByText(/mi local/i)).not.toBeInTheDocument();

    // Verificamos que muestre correctamente la etiqueta de rol
    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
  });

  it('does not render super-admin navigation items for standard admin', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '2', name: 'Vegeta', email: 'vegeta@dbz.com', phone: '', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    renderSidebar();

    // No debe mostrar los menús de super admin
    expect(screen.queryByText(/resumen global/i)).not.toBeInTheDocument();
    
    // Debe mostrar los del admin normal
    expect(screen.getByText(/mi local/i)).toBeInTheDocument();
    expect(screen.getByText(/administrador/i)).toBeInTheDocument();
  });
});
