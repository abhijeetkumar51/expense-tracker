import React, { createContext, useState, useContext } from 'react';
import api, { setApiToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Read from localStorage on initial load so session persists after refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setApiToken(savedToken); // Inject into axios interceptor immediately
    }
    return savedToken || null;
  });

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setApiToken(jwtToken);
    
    // Save to browser storage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiToken(null);
    
    // Remove from browser storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
