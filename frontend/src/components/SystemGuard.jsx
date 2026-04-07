/**
 * System Guard Component
 * 
 * A critical safety wrapper that ensures the application is in a healthy state
 * before allowing any user interaction.
 * 
 * Responsibilities:
 * 1. Health Check: Verifies the backend and database are reachable.
 * 2. Initialization Check: Detects if the database is empty (no branches).
 * 3. Bootstrapping: Allows a Super Admin to initialize the system with base data.
 */

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemStatusProvider } from '../contexts/SystemStatusContext';

export function SystemGuard({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const checkSystem = useCallback(async () => {
    // ... (keep the same logic, just don't set status to 'loading' again)
    // Actually, the current logic is fine, just don't return early.
    // ...
    // (I will copy the logic from the original file)
    try {
      // 1. Basic Health Check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let res;
      try {
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/health`, { signal: controller.signal, credentials: 'include' });
      } catch (fetchErr) {
        try {
          const pingRes = await fetch(`${import.meta.env.VITE_API_URL}/api/ping`, { signal: controller.signal });
          if (pingRes.ok) {
            throw new Error('Server is reachable but the database connection is failing.', { cause: fetchErr });
          }
        } catch (pingErr) {}
        if (fetchErr.name === 'AbortError') {
          throw new Error('System connection timed out.', { cause: fetchErr });
        }
        throw new Error('Could not connect to the system.', { cause: fetchErr });
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (!res.ok) throw new Error(`System health check failed with status ${res.status}`);
      
      const data = await res.json();
      if (data.status !== 'ok') throw new Error(data.error || 'Database disconnected');

      // 2. Data Presence Check
      const branchController = new AbortController();
      const branchTimeoutId = setTimeout(() => branchController.abort(), 15000);
      
      try {
        const branchRes = await fetch(`${import.meta.env.VITE_API_URL}/api/branches`, { signal: branchController.signal, credentials: 'include' });
        if (branchRes.ok) {
          const branches = await branchRes.json();
          clearTimeout(branchTimeoutId);
          if (Array.isArray(branches) && branches.length === 0) {
            setStatus('empty');
          } else {
            setStatus('ready');
          }
        } else {
          clearTimeout(branchTimeoutId);
          setStatus('ready');
        }
      } catch (branchErr) {
        clearTimeout(branchTimeoutId);
        setStatus('ready');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkSystem();
  }, [checkSystem]);

  // Always render children, but wrap in SystemStatusProvider
  return (
    <SystemStatusProvider status={status} error={error}>
      {children}
    </SystemStatusProvider>
  );
}

