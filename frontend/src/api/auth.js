import api from '../services/api';

export const login = async (email, password) => {
  return await api.post('/auth/login', { email, password });
};

export const register = async (userData) => {
  return await api.post('/auth/register', userData);
};

export const getProfile = async () => {
  return await api.get('/users/me');
};

export const updateProfile = async (userData) => {
  return await api.put('/users/me', userData);
};

export const changePassword = async (passwords) => {
  return await api.post('/users/me/change-password', passwords);
};
