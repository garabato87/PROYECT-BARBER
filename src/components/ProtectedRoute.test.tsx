import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as authHook from '../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (allowedRoles: ('super-admin' | 'admin' | 'professional' | 'client')[]) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state when auth is loading', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
    });

    renderWithRouter(['super-admin']);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
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

    renderWithRouter(['super-admin']);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects to home when authenticated but unauthorized (client trying to access super-admin)', () => {
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

    renderWithRouter(['super-admin']);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders protected content when authenticated and authorized (super-admin)', () => {
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

    renderWithRouter(['super-admin']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
