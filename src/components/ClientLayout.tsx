import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  User, 
  LogOut,
  Scissors
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import './Sidebar.css'; // Reusing the premium Sidebar styles
import './Layout.css';  // Reusing the premium Layout styles

interface ClientLayoutProps {
  children: React.ReactNode;
  title: string;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <Scissors size={28} strokeWidth={2.5} />
            <span className="logo-text">SDGP</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Search size={20} />
            <span>Explorar</span>
          </NavLink>
          
          {user && (
            <NavLink to="/client/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Mis Reservas</span>
            </NavLink>
          )}

          {!user ? (
            <NavLink to="/login" className="nav-item">
              <User size={20} />
              <span>Iniciar Sesión</span>
            </NavLink>
          ) : (
            <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </div>
          )}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">Cliente</span>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <Header title={title} />
        <div className="page-container animate-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
