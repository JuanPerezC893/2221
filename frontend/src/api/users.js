import api from '../services/api';

// Obtener el perfil completo del usuario autenticado
export const getMyProfile = () => {
  return api.get('/users/me');
};

// Actualizar el rol y estado de un usuario (para administradores)
export const updateUserStatus = (userId, statusData) => {
  return api.put(`/users/${userId}/status`, statusData);
};
