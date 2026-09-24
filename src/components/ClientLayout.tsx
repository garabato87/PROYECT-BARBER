/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import { 
  Calendar, 
  Search, 
  User, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ClientLayoutProps {
  children: React.ReactNode;
  title: string;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeSidebar = () => setIsMobileSidebarOpen(false);

  const handleLogout = () => {
    closeSidebar();
    logout();
    navigate('/login');
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  const navItems = [
    { to: "/", icon: Search, label: "Explorar" },
    ...(user ? [{ to: "/client/dashboard", icon: Calendar, label: "Mis Reservas" }] : []),
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-glass-border bg-surface backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-[76px] shrink-0 items-center px-6">
          <BrandLogo className="h-8" />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                isActive 
                  ? "bg-accent-glow text-accent shadow-sm" 
                  : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon size={20} className="transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {!user ? (
            <NavLink to="/login" className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary transition-all duration-300 hover:bg-surface-hover hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <User size={20} className="transition-transform group-hover:scale-110" />
              <span>Iniciar Sesión</span>
            </NavLink>
          ) : (
            <button 
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-text-secondary transition-all duration-300 hover:bg-danger-bg hover:text-danger md:hidden outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOut size={20} className="transition-transform group-hover:scale-110" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>

        {user && (
          <div className="mt-auto border-t border-glass-border p-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface-hover p-3 shadow-sm transition-colors hover:bg-glass-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-on-primary shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-text-muted">Cliente</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col">
        <Header title={title} onMenuToggle={toggleSidebar} />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-7xl h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
