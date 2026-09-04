import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User } from '../types';
import axios from 'axios';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  demoLogin: (name?: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Set authorization headers globally for axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error("Failed to parse stored user session", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const demoLogin = (name = 'Farmer Ramesh') => {
    const demoUser: User = {
      id: 'demo-farmer-001',
      phone_number: '+919876543210',
      email: 'farmer@agrismart.ai',
      full_name: name,
      preferred_lang: (localStorage.getItem('language') as any) || 'en',
      created_at: new Date().toISOString(),
    };
    login('demo-session-token-' + Date.now(), demoUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    // Note: farms, crops, tractor expenses and disease history are preserved in localStorage
    // so farmer data is NEVER lost across login/logout!
  };

  return (
    <AuthContext.Provider value={{ user, token, login, demoLogin, logout, loading }}>
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
export default AuthContext;
