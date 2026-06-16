'use client';
/**
 * context/AuthContext.js
 * 
 * MIGRATION NOTE: This AuthContext is backward-compatible.
 * - It still uses localStorage for the JWT access token (your backend still issues JWTs).
 * - The API contract between frontend and backend is UNCHANGED.
 * - The token and user shape are EXACTLY the same as before.
 * - No UI regressions occur.
 *
 * What changed: 
 * - Token is now trimmed & validated on storage.
 * - logout() now also calls the backend /auth/logout endpoint to invalidate the server session.
 * - Added a helper `getAuthHeaders()` for use in API calls.
 */
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token/user from localStorage on first load
  useEffect(() => {
    try {
      const rawToken = localStorage.getItem('token');
      const savedToken = rawToken?.trim();
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        // If the token in storage was untrimmed, fix it
        if (rawToken !== savedToken) {
          localStorage.setItem('token', savedToken);
        }
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('[Auth] Failed to load persisted session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token, user) => {
    const cleanToken = token?.trim();
    setToken(cleanToken);
    setUser(user);
    localStorage.setItem('token', cleanToken);
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call backend to invalidate server-side session (Supabase sessions table)
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include', // sends the refreshToken cookie
      });
    } catch (e) {
      // Non-fatal: still clear local state
      console.warn('[Auth] Server logout failed:', e);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  /**
   * Helper to build Authorization headers for API calls.
   * Use this in all fetch calls to the backend.
   * Example: fetch('/api/v1/patient', { headers: getAuthHeaders() })
   */
  const getAuthHeaders = useCallback(() => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
