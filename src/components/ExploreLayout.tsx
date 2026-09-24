import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import PublicFooter from './PublicFooter';
import { Sun, Moon, User, LogOut, Menu, X, Calendar, Search, LayoutDashboard, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ExploreLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ExploreLayout: React.FC<ExploreLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'super-admin': return '/superadmin';
      case 'admin': return '/admin/dashboard';
      case 'professional': return '/agenda';
      default: return '/client/dashboard';
    }
  };

  const isClient = user?.role === 'client';
  const isOtherRole = user && user.role !== 'client';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      
      {/* Horizontal Header */}
      <header className="sticky top-0 z-50 flex h-[76px] w-full items-center justify-between border-b border-glass-border bg-surface/80 px-4 backdrop-blur-xl md:px-8">
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <NavLink to="/" className="flex items-center transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <BrandLogo className="h-[48px] sm:h-[76px]" />
          </NavLink>
        </div>

        {/* Center/Right: Desktop Navigation */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-3 lg:gap-6 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) => cn(
              "text-sm font-semibold transition-colors",
              isActive ? "text-accent" : "text-text-secondary hover:text-foreground"
            )}
          >
            Explorar
          </NavLink>

          <NavLink to="/para-negocios" className="whitespace-nowrap rounded-full border border-accent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-black">
            Sumá tu negocio
          </NavLink>
          {isClient && (
            <NavLink
              to="/client/dashboard"
              className={({ isActive }) => cn(
                "text-sm font-semibold transition-colors",
                isActive ? "text-accent" : "text-text-secondary hover:text-foreground"
              )}
            >
              Mis Reservas
            </NavLink>
          )}

          {isOtherRole && (
            <NavLink
              to={getDashboardRoute()}
              className="flex items-center gap-2 rounded-full border border-glass-border bg-surface-hover px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <LayoutDashboard size={16} />
              Panel de Control
            </NavLink>
          )}
          
          <div className="h-6 w-px bg-glass-border"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
            aria-label="Alternar tema"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'light' ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.div>
          </button>

          {/* Auth Actions */}
          {!isLoading && (
            <>
              {!user ? (
                <NavLink
                  to="/login"
                  className="rounded-full bg-accent px-6 py-2 text-sm font-bold text-on-primary shadow-glow transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Ingresar
                </NavLink>
              ) : (
                <div className="group relative">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover border border-glass-border font-bold text-accent transition-colors hover:border-accent">
                    {user.name?.charAt(0).toUpperCase() || <User size={18} />}
                  </button>
                  
                  {/* Dropdown Profile */}
                  <div className="absolute right-0 top-full mt-2 hidden w-48 flex-col overflow-hidden rounded-xl border border-glass-border bg-surface shadow-xl group-hover:flex">
                    <div className="border-b border-glass-border px-4 py-3">
                      <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-text-muted">{user.email}</p>
                    </div>
                    <NavLink to="/profile" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-foreground">
                      <Settings size={16} /> Perfil
                    </NavLink>
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-glass-border bg-surface px-4 py-4 md:hidden overflow-hidden"
          >
            <nav className="flex flex-col space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  isActive ? "bg-accent/10 text-accent" : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <Search size={20} /> Explorar
              </NavLink>

              <NavLink to="/para-negocios" className="whitespace-nowrap rounded-full border border-accent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-black">
            Sumá tu negocio
          </NavLink>
          {isClient && (
                <NavLink
                  to="/client/dashboard"
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive ? "bg-accent/10 text-accent" : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <Calendar size={20} /> Mis Reservas
                </NavLink>
              )}

              {isOtherRole && (
                <NavLink
                  to={getDashboardRoute()}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-foreground"
                >
                  <LayoutDashboard size={20} /> Panel de Control
                </NavLink>
              )}

              <div className="my-2 h-px w-full bg-glass-border"></div>

              {!isLoading && (
                <>
                  {!user ? (
                    <NavLink
                      to="/login"
                      className="flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-primary shadow-glow"
                    >
                      Ingresar
                    </NavLink>
                  ) : (
                    <>
                      <NavLink
                        to="/profile"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-foreground"
                      >
                        <User size={20} /> Mi Perfil
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/10"
                      >
                        <LogOut size={20} /> Cerrar Sesión
                      </button>
                    </>
                  )}
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />

    </div>
  );
};

export default ExploreLayout;
