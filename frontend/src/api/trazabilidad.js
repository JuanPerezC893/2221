import api from '../services/api';

// Esta función es para uso interno, requiere autenticación
export const addTrazabilidad = async (data) => {
  return await api.post('/trazabilidad', data);
};

// Esta función es pública, no requiere autenticación
export const getTrazabilidadPublica = async (id) => {
  return await api.get(`/trazabilidad/${id}`);
};

// Nueva función pública para confirmar la entrega
export const confirmarEntrega = async (id, codigo_entrega) => {
  return await api.post(`/trazabilidad/${id}/confirmar-entrega`, { codigo_entrega });
};

export const reclamarResiduo = (idResiduo) => {
  return api.post(`/trazabilidad/reclamar/${idResiduo}`);
};