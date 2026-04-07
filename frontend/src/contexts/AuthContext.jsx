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

const AuthContext = createContext(undefined);
const API_BASE = import.meta.env.VITE_API_URL?.trim() || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // On initial load, check if the user has a valid session cookie
    console.log('AuthContext: Checking session...');
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
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
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const userData = await res.json();
    if (userData && typeof userData === 'object') {
      setUser(userData);
    }
    return userData;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
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
