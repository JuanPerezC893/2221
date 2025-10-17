import api from '../services/api';

// Obtener la lista de residuos reclamados por el gestor logueado
export const getMisResiduos = () => {
  return api.get('/gestor/mis-residuos');
};
