/**
 * Shared Layout Wrapper
 * 
 * Wraps every protected page in the application.
 * It provides:
 * 1. Toast Notifications context.
 * 2. The AppShell (Sidebar, Header, and Main Content area).
 */

import React from 'react';
import { AppShell } from './layout/AppShell';
import { ToastProvider } from './ui/Toast';

export function Layout({ children }) {
  return (
    <ToastProvider>
      <AppShell>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
