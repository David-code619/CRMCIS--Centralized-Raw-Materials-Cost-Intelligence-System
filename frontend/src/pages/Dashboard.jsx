import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { SuperAdminDashboard } from '../components/dashboard/SuperAdminDashboard';
import { BranchManagerDashboard } from '../components/dashboard/BranchManagerDashboard';
import { InventoryOfficerDashboard } from '../components/dashboard/InventoryOfficerDashboard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSystemStatus } from '../contexts/SystemStatusContext';
import { apiFetch } from '../lib/api';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { status, error } = useSystemStatus();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      setFetchError(null);
      const res = await apiFetch('/api/stats');
      if (res.status === 401) {
        // Avoid hard reload loops; let auth context clear state and route normally.
        await logout();
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Stats fetch error response:', errorText);
        throw new Error(`Failed to fetch stats: ${res.status}`);
      }
      const data = await res.json();
      
      if (data && typeof data.totalStockValue === 'number') {
        setStats(data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
      setFetchError(error.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (status === 'ready' || status === 'error' || status === 'empty')) {
      fetchStats();
    }
  }, [user, status]);

  // Redirect to role-specific dashboard if at root
  if (location.pathname === '/') {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/dashboard/super-admin" replace />;
      case 'BRANCH_MANAGER':
        return <Navigate to="/dashboard/branch-manager" replace />;
      case 'INVENTORY_OFFICER':
        return <Navigate to="/dashboard/inventory-officer" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  const handleRefresh = () => {
    addToast('Refreshing intelligence data...', 'info');
    fetchStats();
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-text-secondary font-medium animate-pulse">Analyzing cost intelligence...</p>
        </div>
      );
    }

    if (fetchError || !stats) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-danger mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Intelligence Analysis Failed</h2>
          <p className="text-text-secondary max-w-md mx-auto">
            {fetchError || "We couldn't aggregate your cost data at this time. This usually happens if the database is busy or the session has expired."}
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Loader2 className={loading ? "w-4 h-4 animate-spin" : "hidden"} />
            Retry Analysis
          </button>
        </div>
      );
    }

    switch (user?.role) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard stats={stats} onRefresh={handleRefresh} />;
      case 'BRANCH_MANAGER':
        return <BranchManagerDashboard stats={stats} onRefresh={handleRefresh} />;
      case 'INVENTORY_OFFICER':
        return <InventoryOfficerDashboard stats={stats} onRefresh={handleRefresh} />;
      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary">Access Restricted</h2>
            <p className="text-text-secondary mt-2">Your account role is not recognized. Please contact HQ.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {status === 'error' && (
        <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error || 'System connection error.'}</p>
        </div>
      )}
      {status === 'empty' && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-center gap-3 text-warning">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Database is uninitialized. Please contact an administrator.</p>
        </div>
      )}
      {renderDashboard()}
    </div>
  );
}
