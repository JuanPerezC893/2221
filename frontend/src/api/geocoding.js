import api from '../services/api';

/**
 * Fetches address suggestions from the backend.
 * @param {string} query The search query.
 * @param {string} sessionToken The session token for Mapbox billing.
 * @returns {Promise<object>}
 */
export const getSuggestions = async (query, sessionToken) => {
  try {
    const response = await api.get('/geocoding/suggest', {
      params: {
        q: query,
        session_token: sessionToken,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch suggestions');
  }
};

/**
 * Retrieves the full details for a selected suggestion.
 * @param {string} mapboxId The Mapbox ID of the suggestion.
 * @param {string} sessionToken The session token used for the suggestion query.
 * @returns {Promise<object>}
 */
export const retrieveSuggestion = async (mapboxId, sessionToken) => {
  try {
    const response = await api.post('/geocoding/retrieve', {
      mapbox_id: mapboxId,
      session_token: sessionToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error retrieving suggestion details:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to retrieve suggestion details');
  }
};
