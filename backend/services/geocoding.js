const axios = require('axios');
require('dotenv').config();

/**
 * Servicio de geocodificación y sugerencias usando Mapbox.
 */

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const MAPBOX_RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

if (!MAPBOX_API_KEY) {
  console.warn('⚠️  Advertencia: MAPBOX_API_KEY no está configurada en .env. El servicio de geocodificación estará deshabilitado.');
}

/**
 * Geocodifica una dirección usando Mapbox.
 * @param {string} address - Dirección a geocodificar.
 * @param {string} [countryCode='CL'] - Código del país para priorizar resultados.
 * @returns {Promise<{lat: number, lon: number, display_name: string, confidence: number} | null>}
 */
const geocodeAddress = async (address, countryCode = 'CL') => {
  if (!MAPBOX_API_KEY) return null;
  if (!address || typeof address !== 'string' || address.trim() === '') {
    console.log('❌ Geocoding (Mapbox): Dirección vacía o inválida');
    return null;
  }

  console.log(`🌍 Geocoding (Mapbox): Buscando coordenadas para "${address}"`);

  try {
    const response = await axios.get(`${MAPBOX_GEOCODING_URL}/${encodeURIComponent(address.trim())}.json`, {
      params: {
        access_token: MAPBOX_API_KEY,
        country: countryCode.toUpperCase(),
        limit: 1,
        language: 'es',
      },
      timeout: 10000,
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const result = response.data.features[0];
      const [lon, lat] = result.center;

      const coordinates = {
        lat,
        lon,
        display_name: result.place_name,
        confidence: result.relevance || 0.5,
      };

      console.log(`✅ Geocoding (Mapbox) exitoso: ${coordinates.lat}, ${coordinates.lon}`);
      console.log(`   Dirección normalizada: ${result.place_name}`);
      
      return coordinates;
    } else {
      console.log(`⚠️  Geocoding (Mapbox): No se encontraron resultados para "${address}"`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en geocodificación (Mapbox):', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      address: address,
    });
    return null;
  }
};

/**
 * Obtiene sugerencias de direcciones desde Mapbox.
 * @param {string} query - Texto de búsqueda parcial.
 * @param {string} [sessionToken] - Un token de sesión para agrupar la búsqueda (recomendado para abaratar costos).
 * @returns {Promise<Array>}
 */
const getSuggestions = async (query, sessionToken) => {
  if (!MAPBOX_API_KEY) return [];
  if (!query || query.trim().length < 2) {
    return []; // No buscar si la consulta es muy corta
  }

  try {
    const response = await axios.get(MAPBOX_SUGGEST_URL, {
      params: {
        q: query,
        access_token: MAPBOX_API_KEY,
        session_token: sessionToken, // Token de sesión para la facturación
        country: 'CL',
        language: 'es',
      },
      timeout: 5000,
    });

    return response.data.suggestions || [];
  } catch (error) {
    console.error('❌ Error al obtener sugerencias (Mapbox):', error.message);
    return [];
  }
};

/**
 * Wrapper para mantener la compatibilidad con el código existente que usa fallbacks.
 * Ahora simplemente llama a la función principal de geocodificación de Mapbox.
 * @param {string} address - Dirección a geocodificar.
 * @returns {Promise<{lat: number, lon: number, display_name: string} | null>}
 */
const geocodeAddressWithFallbacks = async (address) => {
  console.log('Geocodificando con Mapbox (vía wrapper de compatibilidad)');
  return geocodeAddress(address);
};

/**
 * Obtiene coordenadas por defecto para Chile.
 * @returns {{lat: number, lon: number, display_name: string, confidence: number}}
 */
const getDefaultCoordinates = () => {
  return {
    lat: -33.4489, // Santiago, Chile
    lon: -70.6693,
    display_name: 'Santiago, Chile (coordenadas por defecto)',
    confidence: 0.1,
  };
};

module.exports = {
  geocodeAddress,
  getSuggestions,
  geocodeAddressWithFallbacks,
  getDefaultCoordinates,
};

/**
 * Obtiene los detalles completos de una dirección a partir de un mapbox_id de una sugerencia.
 * @param {string} mapboxId - El ID de la sugerencia de Mapbox.
 * @param {string} sessionToken - El mismo token de sesión usado para obtener la sugerencia.
 * @returns {Promise<{lat: number, lon: number, display_name: string, confidence: number} | null>}
 */
const retrieveAddress = async (mapboxId, sessionToken) => {
  if (!MAPBOX_API_KEY || !mapboxId) return null;

  console.log(`📍 Retrieving (Mapbox): Buscando detalles para Mapbox ID "${mapboxId}"`);

  try {
    const response = await axios.get(`${MAPBOX_RETRIEVE_URL}/${mapboxId}`, {
      params: {
        access_token: MAPBOX_API_KEY,
        session_token: sessionToken,
      },
      timeout: 10000,
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const result = response.data.features[0];
      const [lon, lat] = result.geometry.coordinates;

      const fullAddress = {
        lat,
        lon,
        display_name: result.properties.full_address || result.properties.name,
        confidence: 1, // Se asume alta confianza ya que es una selección directa
      };

      console.log(`✅ Retrieve (Mapbox) exitoso: ${fullAddress.lat}, ${fullAddress.lon}`);
      return fullAddress;
    } else {
      console.log(`⚠️  Retrieve (Mapbox): No se encontraron detalles para "${mapboxId}"`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en retrieve (Mapbox):', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      mapboxId: mapboxId,
    });
    return null;
  }
};

module.exports = {
  geocodeAddress,
  getSuggestions,
  retrieveAddress, // <--- Add this export
  geocodeAddressWithFallbacks,
  getDefaultCoordinates,
};