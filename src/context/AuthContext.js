'use client';
// context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Load token/user from localStorage on first load
  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    const savedToken = rawToken?.trim();
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      // If the token in storage was untrimmed, update it immediately to fix direct storage access in other components
      if (rawToken !== savedToken) {
        localStorage.setItem('token', savedToken);
      }
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (token, user) => {
    const cleanToken = token?.trim();
    setToken(cleanToken);
    setUser(user);
    localStorage.setItem('token', cleanToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
