import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Scissors,
  LayoutDashboard,
  Store,
  Users,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminItems = [
    { name: 'Dashboard',      path: '/admin/dashboard',    icon: <LayoutDashboard size={19} /> },
    { name: 'Agenda',         path: '/admin/agenda',        icon: <CalendarDays size={19} /> },
    { name: 'Mi Local',       path: '/admin/mi-local',      icon: <Store size={19} /> },
    { name: 'Servicios',      path: '/admin/servicios',     icon: <ClipboardList size={19} /> },
    { name: 'Profesionales',  path: '/admin/profesionales', icon: <Users size={19} /> },
  ];

  const superAdminItems = [
    { name: 'Resumen Global',  path: '/superadmin',                icon: <ShieldCheck size={19} /> },
    { name: 'Usuarios',        path: '/superadmin/usuarios',       icon: <Users size={19} /> },
    { name: 'Suscripciones',   path: '/superadmin/suscripciones',  icon: <CalendarDays size={19} /> },
    { name: 'Reportes',        path: '/superadmin/reportes',       icon: <LayoutDashboard size={19} /> },
  ];

  const professionalItems = [
    { name: 'Mi Agenda',      path: '/agenda',    icon: <CalendarDays size={19} /> },
  ];

  const navItems = user?.role === 'super-admin' ? superAdminItems 
                 : user?.role === 'admin' ? adminItems 
                 : user?.role === 'professional' ? professionalItems
                 : [];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon-box">
            <Scissors size={18} strokeWidth={2.5} />
          </div>
          <span className="logo-text">SDGP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {user && (
        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-user">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role === 'super-admin' ? 'Super Admin' 
                 : user.role === 'admin' ? 'Administrador' 
                 : user.role === 'professional' ? 'Profesional' 
                 : 'Cliente'}
              </span>
            </div>
          </NavLink>

          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
