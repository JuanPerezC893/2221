import api from '../services/api';

export const getResiduos = async (projectId) => {
  const params = projectId ? { id_proyecto: projectId } : {};
  return await api.get('/residuos', { params });
};

export const getResiduo = async (id) => {
  return await api.get(`/residuos/${id}`);
};

export const createResiduo = async (residuoData) => {
  return await api.post('/residuos', residuoData);
};

export const updateResiduo = async (id, residuoData) => {
  return await api.put(`/residuos/${id}`, residuoData);
};

export const deleteResiduo = async (id) => {
  return await api.delete(`/residuos/${id}`);
};

export const getResiduosTypes = async () => {
    return await api.get('/residuos/types');
};

export const getSummaryByType = async (projectId) => {
    const params = projectId ? { projectId } : {};
    return await api.get('/residuos/summary-by-type', { params });
};

export const getSummaryOverTime = async (projectId) => {
    const params = projectId ? { projectId } : {};
    return await api.get('/residuos/summary-over-time', { params });
};

export const getEnvironmentalImpact = async (projectId) => {
    const params = projectId ? { projectId } : {};
    return await api.get('/residuos/environmental-impact', { params });
};

export const getLatest = async (projectId) => {
    const params = projectId ? { projectId } : {};
    return await api.get('/residuos/latest', { params });
};

export const generarEtiqueta = async (residuoId) => {
  return await api.get(`/residuos/${residuoId}/etiqueta-pdf`, {
    responseType: 'blob', // Important to handle the PDF file
  });
};

export const marcarEnCamino = async (id, destino) => {
  return await api.put(`/residuos/${id}/en-camino`, destino);
};

export const getResiduosDisponibles = (filters) => {
  return api.get('/residuos/disponibles', { params: filters });
};

export const getResiduoDetalle = (id) => {
  return api.get(`/residuos/detalle/${id}`);
};
