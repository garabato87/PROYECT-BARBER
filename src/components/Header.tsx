import React from 'react';
import { Sun, Moon, Bell, Search, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

const IconButton = ({ onClick, children, title, ariaLabel, testId, className = "" }: any) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
    data-testid={testId}
    className={`p-2.5 rounded-full text-text-secondary hover:text-accent hover:bg-surface-hover transition-all ${className}`}
  >
    {children}
  </motion.button>
);

const Header: React.FC<HeaderProps> = ({ title, onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-glass-border bg-surface px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <IconButton 
            onClick={onMenuToggle} 
            testId="mobile-menu-toggle" 
            ariaLabel="Abrir menú"
            className="md:hidden"
          >
            <Menu size={24} />
          </IconButton>
        )}
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <IconButton ariaLabel="Buscar">
          <Search size={20} />
        </IconButton>
        <IconButton ariaLabel="Notificaciones">
          <Bell size={20} />
        </IconButton>
        <IconButton 
          onClick={toggleTheme}
          title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'light' ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.div>
        </IconButton>
        <div className="ml-2 hidden h-8 w-px bg-glass-border md:block"></div>
        <IconButton onClick={handleLogout} title="Cerrar Sesión" className="hidden md:flex">
          <LogOut size={20} />
        </IconButton>
      </div>
    </header>
  );
};

export default Header;
