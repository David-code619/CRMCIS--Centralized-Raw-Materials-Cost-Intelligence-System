/**
 * Application Shell (Main Layout Structure)
 * 
 * Defines the overall UI framework for the application, including:
 * 1. Desktop Sidebar: Collapsible navigation for large screens.
 * 2. Mobile Sidebar: Drawer-style navigation for small screens.
 * 3. Top Navbar: Header with user profile and mobile menu toggle.
 * 4. Main Content Area: Responsive container with standard padding and max-width.
 */

import React, { useState } from 'react';
import { Sidebar } from '../Sidebar';
import { TopNavbar } from './TopNavbar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AppShell({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background font-sans text-text-primary">
      {/* Desktop Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden lg:flex fixed top-0 left-0 h-screen"
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar 
                onToggleCollapse={() => setIsMobileMenuOpen(false)}
                className="w-72"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        <TopNavbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
