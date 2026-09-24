import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import {
  LayoutDashboard,
  Store,
  Users,
  ClipboardList,
  CalendarDays,
  LogOut,
  BarChart2,
  CreditCard,
  PieChart,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminItems = [
    { name: 'Dashboard',      path: '/admin/dashboard',    icon: <LayoutDashboard size={20} /> },
    { name: 'Agenda Gral.',   path: '/admin/agenda',       icon: <CalendarDays size={20} /> },
    { name: 'Mi Agenda (Prof.)', path: '/agenda',          icon: <Calendar size={20} /> },
    { name: 'Mi Local',       path: '/admin/mi-local',     icon: <Store size={20} /> },
    { name: 'Servicios',      path: '/admin/servicios',    icon: <ClipboardList size={20} /> },
    { name: 'Profesionales',  path: '/admin/profesionales', icon: <Users size={20} /> },
  ];

  const superAdminItems = [
    { name: 'Dashboard',     icon: <BarChart2 size={20} />, path: '/superadmin' },
    { name: 'Locales',       icon: <Store size={20} />, path: '/superadmin/locales' },
    { name: 'Usuarios',      icon: <Users size={20} />, path: '/superadmin/usuarios' },
    { name: 'Suscripciones', icon: <CreditCard size={20} />, path: '/superadmin/suscripciones' },
    { name: 'Reportes',      icon: <PieChart size={20} />, path: '/superadmin/reportes' },
    { name: 'Auditoría',     icon: <ShieldAlert size={20} />, path: '/superadmin/audit' },
  ];

  const professionalItems = [
    { name: 'Mi Agenda',      path: '/agenda',    icon: <CalendarDays size={20} /> },
  ];

  const navItems = user?.role === 'super-admin' ? superAdminItems 
                 : user?.role === 'admin' ? adminItems 
                 : user?.role === 'professional' ? professionalItems
                 : [];

  const SidebarContent = (
    <>
      <div className="flex h-[76px] items-center px-6 border-b border-glass-border shrink-0">
        <BrandLogo className="h-8" />
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/superadmin' && item.path !== '/admin/dashboard' && item.path !== '/agenda');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all relative overflow-hidden group outline-none",
                isActive 
                  ? "text-accent bg-accent/10 shadow-sm" 
                  : "text-text-secondary hover:text-foreground hover:bg-surface-hover"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-accent rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "transition-transform",
                !isActive && "group-hover:scale-110"
              )}>
                {item.icon}
              </div>
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-glass-border bg-surface shrink-0">
          <NavLink 
            to="/profile" 
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-background transition-colors mb-2 outline-none group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-primary font-bold text-lg shadow-glow shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-foreground truncate">{user.name}</span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
                {user.role === 'super-admin' ? 'Super Admin' 
                 : user.role === 'admin' ? 'Administrador' 
                 : user.role === 'professional' ? 'Profesional' 
                 : 'Cliente'}
              </span>
            </div>
          </NavLink>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-danger hover:bg-danger/10 hover:text-danger-hover transition-colors outline-none"
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-surface flex flex-col shadow-2xl border-r border-glass-border"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-glass-border bg-surface sticky top-0 shrink-0">
        {SidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
