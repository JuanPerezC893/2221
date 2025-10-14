
import axios from 'axios';

const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

/**
 * Obtiene una ruta entre dos puntos usando la API de Direcciones de Mapbox.
 * @param {[number, number]} start - Coordenadas de inicio [longitud, latitud].
 * @param {[number, number]} end - Coordenadas de fin [longitud, latitud].
 * @returns {Promise<object>} La geometría de la ruta.
 */
export const getDirections = async (start, end) => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('Error: VITE_MAPBOX_ACCESS_TOKEN no está configurado.');
    throw new Error('Mapbox access token no está configurado.');
  }

  const coordinates = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  const url = `${MAPBOX_DIRECTIONS_URL}/${coordinates}`;

  try {
    const response = await axios.get(url, {
      params: {
        geometries: 'geojson',
        access_token: MAPBOX_ACCESS_TOKEN,
      },
    });

    if (response.data.routes && response.data.routes.length > 0) {
      return response.data.routes[0].geometry;
    } else {
      throw new Error('No se encontraron rutas.');
    }
  } catch (error) {
    console.error('Error al obtener la ruta de Mapbox:', error);
    throw error;
  }
};
