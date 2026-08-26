import { Sun, Moon, Bell, Search, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="header-right">
        <button className="icon-button">
          <Search size={20} />
        </button>
        <button className="icon-button">
          <Bell size={20} />
        </button>
        <button 
          className="icon-button theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button className="icon-button" onClick={handleLogout} title="Cerrar Sesión">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
