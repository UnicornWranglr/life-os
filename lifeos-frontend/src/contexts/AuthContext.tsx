// AuthContext — single source of truth for the current user and token.
//
// On mount, reads the stored token from localStorage. If one exists it
// populates the user state immediately from the stored user object (no
// round-trip), so the UI doesn't flash a loading state on refresh.
//
// login()  — called by the Login page after a successful /auth/login response.
//             Persists token + user to localStorage and sets context state.
// logout() — wipes localStorage and clears state, triggering ProtectedRoute
//             to redirect to /login.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // On mount: restore from localStorage
  useEffect(() => {
    const token = localStorage.getItem('lifeos:token');
    const raw   = localStorage.getItem('lifeos:user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        setState({ user, token, isLoading: false });
        return;
      } catch {
        // corrupted storage — fall through to clear
      }
    }
    // Nothing valid stored
    setState(s => ({ ...s, isLoading: false }));
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('lifeos:token', token);
    localStorage.setItem('lifeos:user', JSON.stringify(user));
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lifeos:token');
    localStorage.removeItem('lifeos:user');
    setState({ user: null, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Throw if used outside of AuthProvider — helps catch wiring mistakes early.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
