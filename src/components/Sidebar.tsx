import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Scissors, 
  LayoutDashboard, 
  Store, 
  Users, 
  ClipboardList 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Barbería', path: '/barberia', icon: <Store size={20} /> },
    { name: 'Servicios', path: '/servicios', icon: <ClipboardList size={20} /> },
    { name: 'Profesionales', path: '/profesionales', icon: <Users size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <Scissors size={28} strokeWidth={2.5} />
          <span className="logo-text">SDGP</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">AD</div>
        <div className="user-info">
          <span className="user-name">Admin User</span>
          <span className="user-role">Administrador</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
