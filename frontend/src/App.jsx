// Main Application Component

// Orchestrates the overall application structure, including:
// 1. Theme Management (Dark/Light mode)
// 2. Authentication Context
// 3. System Initialization Guard
// 4. Client-side Routing with Role-Based Access Control (RBAC)

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { MaterialCatalog } from "./pages/MaterialCatalog";
import { BranchMaterialDistribution } from "./pages/BranchMaterialDistribution";
import { PurchaseLog } from "./pages/PurchaseLog";
import { Adjustments } from "./pages/Adjustments";
import { Transfers } from "./pages/Transfers";
import { Reports } from "./pages/Reports";
import { Branches } from "./pages/Branches";
import { Users } from "./pages/Users";
import { Usage } from "./pages/Usage";
import { LandingPage } from "./pages/LandingPage";
import { Settings } from "./pages/Settings";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SystemGuard } from "./components/SystemGuard";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* 
                  Protected Routes sharing the global App Layout.
                  Using a layout route keeps the sidebar and header mounted
                  between navigation, preventing UI flicker and state loss.
                */}
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/dashboard/super-admin"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/branch-manager"
                    element={
                      <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/inventory-officer"
                    element={
                      <ProtectedRoute allowedRoles={["INVENTORY_OFFICER"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "BRANCH_MANAGER"]}>
                        <Inventory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/material-catalog"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                        <MaterialCatalog />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/branch-materials" element={<BranchMaterialDistribution />} />
                  <Route path="/purchases" element={<PurchaseLog />} />
                  <Route path="/adjustments" element={<Adjustments />} />
                  <Route path="/transfers" element={<Transfers />} />
                  <Route path="/usage" element={<Usage />} />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "BRANCH_MANAGER"]}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "BRANCH_MANAGER"]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branches"
                    element={
                      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                        <Branches />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SystemGuard>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
