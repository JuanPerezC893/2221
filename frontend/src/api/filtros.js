import api from '../services/api';

// Obtener listas de opciones para los filtros del dashboard de gestor

export const getTiposResiduoOptions = () => {
  return api.get('/filtros/tipos-residuo');
};

export const getCiudadesOptions = () => {
  return api.get('/filtros/ciudades');
};

export const getEmpresasOptions = () => {
  return api.get('/filtros/empresas');
};
