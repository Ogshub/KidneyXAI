import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { TOKEN_KEY, USER_KEY, clearStoredSession } from './sessionStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      clearStoredSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const userData = {
      id: data.userId || data.id,
      name: data.name,
      email: data.email,
      profilePictureUrl: data.profilePictureUrl || null,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return data;
  };

  const register = async (formData) => {
    const data = await authApi.register(formData);
    const userData = {
      id: data.userId || data.id,
      name: data.name,
      email: data.email,
      profilePictureUrl: data.profilePictureUrl || null,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearStoredSession();
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
