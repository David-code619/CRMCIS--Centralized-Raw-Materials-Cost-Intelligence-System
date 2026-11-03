/**
 * Shared Layout Wrapper
 * 
 * Wraps every protected page in the application.
 * It provides:
 * 1. Toast Notifications context.
 * 2. The AppShell (Sidebar, Header, and Main Content area).
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from './layout/AppShell';

export function Layout({ children }) {
  return (
    <AppShell>
      {children || <Outlet />}
    </AppShell>
  );
}
