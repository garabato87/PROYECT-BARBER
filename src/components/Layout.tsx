import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from './ui/CommandPalette';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar handles its own mobile/desktop rendering logic now */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={closeSidebar} />
      <CommandPalette />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Header title={title} onMenuToggle={toggleSidebar} />
        
        {/* Page Transition Wrapper (Phase 8 Motion System) */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden relative min-w-0"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;
