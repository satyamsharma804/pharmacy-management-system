import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pharma_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest('/auth/me');
        setUser(res.user);
      } catch (err) {
        console.error('Session expired or invalid:', err);
        localStorage.removeItem('pharma_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    localStorage.setItem('pharma_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async ({ name, email, password, role = 'cashier', phone = '' }) => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, role, phone }
    });
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('pharma_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

