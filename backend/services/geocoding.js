const axios = require('axios');

/**
 * Servicio de geocodificación usando Nominatim (OpenStreetMap)
 * Convierte direcciones de texto en coordenadas geográficas
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocodifica una dirección usando Nominatim
 * @param {string} address - Dirección a geocodificar
 * @param {string} [countryCode='CL'] - Código del país (por defecto Chile)
 * @returns {Promise<{lat: number, lon: number, display_name: string} | null>}
 */
const geocodeAddress = async (address, countryCode = 'CL') => {
  try {
    if (!address || typeof address !== 'string' || address.trim() === '') {
      console.log('❌ Geocoding: Dirección vacía o inválida');
      return null;
    }

    console.log(`🌍 Geocoding: Buscando coordenadas para "${address}"`);

    const params = {
      q: address.trim(),
      format: 'json',
      limit: 1,
      countrycodes: countryCode.toLowerCase(),
      addressdetails: 1,
      dedupe: 1,
      // User-Agent es requerido por Nominatim
      // Respetamos las políticas de uso de OpenStreetMap
    };

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params,
      headers: {
        'User-Agent': 'GestionResiduos/1.0 (residuos@empresa.com)', // Cambiar por email real
      },
      timeout: 10000, // 10 segundos de timeout
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        confidence: result.importance || 0.5
      };

      console.log(`✅ Geocoding exitoso: ${coordinates.lat}, ${coordinates.lon}`);
      console.log(`   Dirección normalizada: ${result.display_name}`);
      
      return coordinates;
    } else {
      console.log(`⚠️  Geocoding: No se encontraron resultados para "${address}"`);
      return null;
    }

  } catch (error) {
    console.error('❌ Error en geocodificación:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      address: address
    });

    // Si es un error de red temporal, no fallar completamente
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('   → Error de conectividad, continuando sin coordenadas');
      return null;
    }

    return null;
  }
};

/**
 * Geocodifica una dirección con fallbacks para Chile
 * Intenta varias variaciones de la dirección para mejorar resultados
 * @param {string} address - Dirección original
 * @returns {Promise<{lat: number, lon: number, display_name: string} | null>}
 */
const geocodeAddressWithFallbacks = async (address) => {
  if (!address) return null;

  // Intentar con la dirección original
  let result = await geocodeAddress(address, 'CL');
  if (result) return result;

  // Fallback 1: Añadir Chile al final si no lo tiene
  if (!address.toLowerCase().includes('chile')) {
    console.log('🔄 Geocoding fallback 1: Añadiendo "Chile" a la búsqueda');
    result = await geocodeAddress(`${address}, Chile`, 'CL');
    if (result) return result;
  }

  // Fallback 2: Si contiene región específica, intentar solo con ciudad/comuna
  const parts = address.split(',');
  if (parts.length > 1) {
    console.log('🔄 Geocoding fallback 2: Intentando solo con la primera parte');
    result = await geocodeAddress(`${parts[0].trim()}, Chile`, 'CL');
    if (result) return result;
  }

  // Fallback 3: Buscar en cualquier país si no funciona con Chile
  console.log('🔄 Geocoding fallback 3: Búsqueda global');
  result = await geocodeAddress(address);
  if (result) return result;

  console.log(`❌ Geocoding: Todos los intentos fallaron para "${address}"`);
  return null;
};

/**
 * Obtiene coordenadas por defecto para Chile
 * @returns {{lat: number, lon: number}}
 */
const getDefaultCoordinates = () => {
  return {
    lat: -33.4489, // Santiago, Chile
    lon: -70.6693,
    display_name: 'Santiago, Chile (coordenadas por defecto)',
    confidence: 0.1
  };
};

module.exports = {
  geocodeAddress,
  geocodeAddressWithFallbacks,
  getDefaultCoordinates
};
