/**
 * Login Page
 * 
 * The entry point for all users.
 * 1. Collects email and password.
 * 2. Authenticates via AuthContext.
 * 3. Redirects users to their appropriate dashboard based on their role.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    console.log('Attempting login with:', { email: trimmedEmail, password });
    try {
      // Authenticate via the AuthContext login method
      const user = await login(trimmedEmail, password);
      
      // Determine the correct dashboard path based on the user's role
      let dashboardPath = '/';
      if (user.role === 'SUPER_ADMIN') dashboardPath = '/dashboard/super-admin';
      else if (user.role === 'BRANCH_MANAGER') dashboardPath = '/dashboard/branch-manager';
      else if (user.role === 'INVENTORY_OFFICER') dashboardPath = '/dashboard/inventory-officer';

      // Redirect to the intended page (if they were intercepted) or their dashboard
      navigate(from === '/' ? dashboardPath : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-3xl shadow-xl border border-border">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">CRMCIS</h2>
          <p className="mt-2 text-sm text-text-tertiary">Cost Intelligence System Login</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-text-secondary ml-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-text-tertiary"
                placeholder="admin@crmcis.com"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-text-secondary ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-text-tertiary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-text-tertiary">
          <p>Demo credentials:</p>
          <p className="mt-1">obayidavid02@gmail.com / admin123</p>
          <p className="mt-1">manager@crmcis.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
