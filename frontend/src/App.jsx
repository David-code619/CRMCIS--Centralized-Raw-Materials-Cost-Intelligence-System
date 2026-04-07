
// Main Application Component
  
// Orchestrates the overall application structure, including:
// 1. Theme Management (Dark/Light mode)
// 2. Authentication Context
// 3. System Initialization Guard
// 4. Client-side Routing with Role-Based Access Control (RBAC)


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { MaterialCatalog } from './pages/MaterialCatalog';
import { BranchMaterialDistribution } from './pages/BranchMaterialDistribution';
import { PurchaseLog } from './pages/PurchaseLog';
import { Adjustments } from './pages/Adjustments';
import { Transfers } from './pages/Transfers';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Usage } from './pages/Usage';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SystemGuard } from './components/SystemGuard';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          {/* AuthProvider makes user session data available to all components */}
          <AuthProvider>
            {/* SystemGuard ensures the database is initialized before the app is accessible */}
            <SystemGuard>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 
              Protected Routes 
              The ProtectedRoute component handles session verification and 
              role-based authorization before rendering the page.
            */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Role-Specific Dashboards */}
            <Route path="/dashboard/super-admin" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard/branch-manager" element={
              <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard/inventory-officer" element={
              <ProtectedRoute allowedRoles={['INVENTORY_OFFICER']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_MANAGER']}>
                <Layout><Inventory /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/material-catalog" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Layout><MaterialCatalog /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/branch-materials" element={
              <ProtectedRoute>
                <Layout><BranchMaterialDistribution /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/purchases" element={
              <ProtectedRoute>
                <Layout><PurchaseLog /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/adjustments" element={
              <ProtectedRoute>
                <Layout><Adjustments /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/transfers" element={
              <ProtectedRoute>
                <Layout><Transfers /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/usage" element={
              <ProtectedRoute>
                <Layout><Usage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_MANAGER']}>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Layout><Users /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SystemGuard>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
  </ErrorBoundary>
  );
}
