import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        let savedToken = null;
        let savedUserStr = null;
        if (Platform.OS === 'web') {
          savedToken = localStorage.getItem('kidneycare_token');
          savedUserStr = localStorage.getItem('kidneycare_user');
        } else {
          savedToken = await SecureStore.getItemAsync('kidneycare_token');
          savedUserStr = await SecureStore.getItemAsync('kidneycare_user');
        }
        
        if (savedToken && savedUserStr) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserStr));
        }
      } catch (error) {
        console.error('Failed to load session', error);
        await logout();
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, []);

  const login = async (credentials: any) => {
    const data = await authApi.login(credentials);
    const userData: User = {
      id: data.userId || data.id,
      name: data.name,
      email: data.email,
      profilePictureUrl: data.profilePictureUrl || null,
    };
    setToken(data.token);
    setUser(userData);
    if (Platform.OS === 'web') {
      localStorage.setItem('kidneycare_token', data.token);
      localStorage.setItem('kidneycare_user', JSON.stringify(userData));
    } else {
      await SecureStore.setItemAsync('kidneycare_token', data.token);
      await SecureStore.setItemAsync('kidneycare_user', JSON.stringify(userData));
    }
  };

  const register = async (formData: any) => {
    const data = await authApi.register(formData);
    const userData: User = {
      id: data.userId || data.id,
      name: data.name,
      email: data.email,
      profilePictureUrl: data.profilePictureUrl || null,
    };
    setToken(data.token);
    setUser(userData);
    if (Platform.OS === 'web') {
      localStorage.setItem('kidneycare_token', data.token);
      localStorage.setItem('kidneycare_user', JSON.stringify(userData));
    } else {
      await SecureStore.setItemAsync('kidneycare_token', data.token);
      await SecureStore.setItemAsync('kidneycare_user', JSON.stringify(userData));
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('kidneycare_token');
      localStorage.removeItem('kidneycare_user');
    } else {
      await SecureStore.deleteItemAsync('kidneycare_token').catch(() => {});
      await SecureStore.deleteItemAsync('kidneycare_user').catch(() => {});
    }
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
