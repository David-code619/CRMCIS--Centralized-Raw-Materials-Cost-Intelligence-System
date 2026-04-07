/**
 * Protected Route Component
 * 
 * Secures frontend routes by checking the user's authentication status and role.
 * 1. Shows a loading spinner while the session is being verified.
 * 2. Redirects unauthenticated users to the Login page.
 * 3. Redirects authenticated but unauthorized users (wrong role) back to their respective dashboards.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a minimal loading state while checking the JWT session
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    // Not logged in: Redirect to login and save the attempted URL for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but unauthorized: Redirect to the user's default dashboard based on their role
    let dashboardPath = '/';
    if (user.role === 'SUPER_ADMIN') dashboardPath = '/dashboard/super-admin';
    else if (user.role === 'BRANCH_MANAGER') dashboardPath = '/dashboard/branch-manager';
    else if (user.role === 'INVENTORY_OFFICER') dashboardPath = '/dashboard/inventory-officer';
    
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
