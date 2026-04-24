import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <Header title={title} />
        <div className="page-container animate-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
