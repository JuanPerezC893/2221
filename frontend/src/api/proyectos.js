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

export const deleteProyecto = (id) => {
  return api.delete(`/proyectos/${id}`);
};

export const exportProyectosToExcel = async () => {
  try {
    const response = await api.get('/proyectos/export-excel', {
      responseType: 'blob', // Important for handling file downloads
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'proyectos.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Handle error, e.g., show a notification to the user
  }
};

export const generarInforme = async (id) => {
  return await api.post(`/proyectos/${id}/generar-informe`, {}, {
    responseType: 'blob',
  });
};
