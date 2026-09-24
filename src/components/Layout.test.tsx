import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import * as authHook from '../hooks/useAuth';
import * as themeHook from '../hooks/useTheme';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('Layout Component - Responsive Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
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

    vi.mocked(themeHook.useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
    });
  });

  const renderLayout = () => {
    render(
      <MemoryRouter>
        <Layout title="Test Page">
          <div data-testid="page-content">Content</div>
        </Layout>
      </MemoryRouter>
    );
  };

  it('renders a hamburger menu button to toggle sidebar', () => {
    renderLayout();
    
    // Debería existir un botón para abrir el menú (con aria-label "Abrir menú" o data-testid)
    const toggleButton = screen.getByTestId('mobile-menu-toggle');
    expect(toggleButton).toBeInTheDocument();

    // El sidebar no debería tener la clase "mobile-open" al inicio
    const sidebar = screen.getByRole('complementary'); // HTML5 aside role
    expect(sidebar).not.toHaveClass('mobile-open');

    // Al hacer click, debería abrirse
    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass('mobile-open');
  });
});
