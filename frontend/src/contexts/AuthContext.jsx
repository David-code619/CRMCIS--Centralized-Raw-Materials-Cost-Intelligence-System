/**
 * Authentication Context
 * 
 * Manages the global user session state for the frontend.
 * It handles:
 * 1. Session Persistence: Checks for an existing JWT on mount via /api/auth/me.
 * 2. Login/Logout: Communicates with the backend to establish or clear sessions.
 * 3. User Data: Provides the current user's profile and role to all components.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAuthToken, clearAuthToken } from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // On initial load, check if the user has a valid session cookie
    console.log('AuthContext: Checking session...');
    apiFetch('/api/auth/me')
      .then((res) => {
        console.log('AuthContext: /api/auth/me response status:', res.status);
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (!isActive) return;
        console.log('AuthContext: /api/auth/me data:', data);
        setUser((currentUser) => {
          if (currentUser) return currentUser;
          return data && typeof data === 'object' ? data : null;
        });
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('AuthContext: /api/auth/me error:', err);
        setUser((currentUser) => (currentUser ? currentUser : null));
      })
      .finally(() => {
        if (!isActive) return;
        console.log('AuthContext: Loading finished');
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Authenticates a user and establishes a session.
   * The backend sets an HTTP-only JWT cookie upon success.
   */
  const login = async (email, password) => {
    console.log('AuthContext: login called with:', { email, password });
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const userData = await res.json();
    if (userData && typeof userData === 'object') {
      if (userData.token) setAuthToken(userData.token);
      setUser(userData);
    }
    return userData;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
