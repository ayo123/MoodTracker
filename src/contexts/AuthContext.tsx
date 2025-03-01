import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const AuthContext = createContext({
  isAuthenticated: false,
  login: async (email: string, password: string) => {},
  logout: async () => {},
  register: async (email: string, password: string) => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const isAuth = await authService.isAuthenticated();
    setIsAuthenticated(isAuth);
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  const register = async (email: string, password: string) => {
    const response = await authService.register(email, password);
    setIsAuthenticated(true);
    return response;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}; 