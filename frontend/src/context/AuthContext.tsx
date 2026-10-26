import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartspend_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smartspend_token');
      const storedUser = localStorage.getItem('smartspend_user');
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh in background
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('smartspend_user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;
    setToken(access_token);
    setUser(loggedUser);
    localStorage.setItem('smartspend_token', access_token);
    localStorage.setItem('smartspend_user', JSON.stringify(loggedUser));
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      phone,
    });
    const { access_token, user: registeredUser } = res.data;
    setToken(access_token);
    setUser(registeredUser);
    localStorage.setItem('smartspend_token', access_token);
    localStorage.setItem('smartspend_user', JSON.stringify(registeredUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartspend_token');
    localStorage.removeItem('smartspend_user');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('smartspend_user', JSON.stringify(res.data));
    } catch {
      // silent
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
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
