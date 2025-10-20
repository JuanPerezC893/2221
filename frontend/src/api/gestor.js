import api from '../services/api';

// Obtener la lista de residuos reclamados por el gestor logueado
export const getMisResiduos = () => {
  return api.get('/gestor/mis-residuos');
};

// Actualizar el estado de un residuo
export const updateResiduoEstado = (id, estado) => {
  return api.put(`/gestor/residuos/${id}/estado`, { estado });
};
