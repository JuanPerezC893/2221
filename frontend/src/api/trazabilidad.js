import api from '../services/api';

export const createTrazabilidad = async (trazabilidadData) => {
  return await api.post('/trazabilidad', trazabilidadData);
};
