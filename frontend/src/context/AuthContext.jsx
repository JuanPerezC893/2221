import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, isAuthenticated: false, user: null });
  const [dataRefreshKey, setDataRefreshKey] = useState(0); // Unified refresh key

  const loadUserFromToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setAuth({ token: null, isAuthenticated: false, user: null });
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setAuth({ token, isAuthenticated: true, user: { id: decoded.id, rol: decoded.rol, empresa_rut: decoded.empresa_rut, nombre: decoded.nombre, nombre_empresa: decoded.nombre_empresa } });
        }
      } catch (err) {
        console.error('Error decoding token', err);
        localStorage.removeItem('token');
        setAuth({ token: null, isAuthenticated: false, user: null });
      }
    } else {
      setAuth({ token: null, isAuthenticated: false, user: null });
    }
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token } = res.data;
    localStorage.setItem('token', token);
    loadUserFromToken(); // Load user from the new token
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setAuth({ token: null, isAuthenticated: false, user: null });
  };

  const triggerDataRefresh = () => {
    setDataRefreshKey(prevKey => prevKey + 1);
  };

  const updateUser = (updatedUserData) => {
    setAuth(prevAuth => ({
      ...prevAuth,
      user: {
        ...prevAuth.user,
        ...updatedUserData
      }
    }));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, dataRefreshKey, triggerDataRefresh, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
