
import api from '../services/api';

// Función para crear una nueva entrada de trazabilidad (usada en AddWaste.jsx)
export const createTrazabilidad = (data) => {
    return api.post('/trazabilidad', data);
};

// Función para obtener los datos de trazabilidad pública de un residuo
export const getTrazabilidadPublica = (id) => {
    return api.get(`/trazabilidad/${id}`);
};

// Función para confirmar la entrega de un residuo
export const confirmarEntrega = (id, codigo_entrega) => {
    return api.post(`/trazabilidad/${id}/confirmar-entrega`, { codigo_entrega });
};
