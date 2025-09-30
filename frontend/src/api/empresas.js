import api from '../services/api';

export const checkCompanyByRut = async (rut) => {
  return await api.get(`/empresas/check/${rut}`);
};
