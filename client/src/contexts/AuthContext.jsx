import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setUser(data);
    return data;
  };

  const signup = async (email, password) => {
    await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return login(email, password);
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateSettings = async (timezone, emailRemindersEnabled) => {
    const data = await apiFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ timezone, emailRemindersEnabled })
    });
    setUser(prev => ({ ...prev, ...data }));
    return data;
  };

  const deleteAccount = async (password) => {
    await apiFetch('/account', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateSettings, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
