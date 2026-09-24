import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import * as authHook from './hooks/useAuth';

// Mock the useAuth hook
vi.mock('./hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock SplashScreen to bypass it immediately
vi.mock('./components/SplashScreen', () => ({
  default: ({ finishLoading }: { finishLoading: () => void }) => {
    finishLoading();
    return null;
  }
}));

describe('App Routing - Super Admin Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users trying to access /superadmin to /login', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/superadmin']}>
        <App />
      </MemoryRouter>
    );

    // Should render the LoginPage (has text "Iniciar Sesión")
    expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
  });

  it('redirects unauthorized users (e.g., client) trying to access /superadmin to /', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', phone: '', role: 'client' },
      isAuthenticated: true,
      isLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/superadmin']}>
        <App />
      </MemoryRouter>
    );

    // Should render HomePage (has text "Todos los locales")
    expect(screen.getByText(/todos los locales/i)).toBeInTheDocument();
  });

  it('allows super-admin to access /superadmin', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '1', name: 'Admin', email: 'admin@test.com', phone: '', role: 'super-admin' },
      isAuthenticated: true,
      isLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/superadmin']}>
        <App />
      </MemoryRouter>
    );

    // Should render SuperAdminDashboard (has text in Sidebar or Dashboard)
    expect(screen.getByText(/resumen global/i)).toBeInTheDocument();
  });
});
