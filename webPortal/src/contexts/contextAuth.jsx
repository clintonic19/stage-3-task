// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { verifyAuth } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await verifyAuth();
      console.log(response)
      if (response.authenticated) {
        setUser(response.user);
        setRole(response.user.role);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCsrfToken()
      }
    });
    setUser(null);
    setRole(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};