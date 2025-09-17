import api from '../services/api';

export const getProyectos = async () => {
  return await api.get('/proyectos');
};

export const getProyecto = async (id) => {
  return await api.get(`/proyectos/${id}`);
};

export const createProyecto = async (proyectoData) => {
  return await api.post('/proyectos', proyectoData);
};

export const updateProyecto = async (id, proyectoData) => {
  return await api.put(`/proyectos/${id}`, proyectoData);
};

export const deleteProyecto = async (id) => {
  return await api.delete(`/proyectos/${id}`);
};

export const generarInforme = async (id) => {
  return await api.post(`/proyectos/${id}/generar-informe`, {}, {
    responseType: 'blob',
  });
};
