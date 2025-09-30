import api from '../services/api';

/**
 * Updates a user's role and status.
 * @param {number} userId The ID of the user to update.
 * @param {object} data The data to update, e.g., { rol: 'admin', estado: 'aprobado' }.
 * @returns {Promise} The API response.
 */
export const updateUserStatus = (userId, data) => {
  return api.put(`/users/${userId}/status`, data);
};
