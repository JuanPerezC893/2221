import React, { useState } from 'react';
import './ConfirmationModal.css';

const ConfirmarEnvioModal = ({ residuo, onClose, onConfirm, loading }) => {
  const [destino, setDestino] = useState('');
  const [error, setError] = useState(''); // Estado para el mensaje de error

  if (!residuo) return null;

  const handleConfirm = () => {
    if (destino.trim() === '') {
      setError('El campo de destino es obligatorio.'); // Establece el mensaje de error
      return;
    }
    onConfirm(residuo.id_residuo, destino);
  };

  const handleDestinoChange = (e) => {
    setDestino(e.target.value);
    if (error) {
      setError(''); // Limpia el error cuando el usuario escribe
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom">
        <div className="modal-header-custom">
          <h2 className="h5">Confirmar Envío de Residuo</h2>
        </div>
        <p className="mt-3">Por favor confirma el envío del siguiente residuo:</p>
        <ul>
          <li><strong>ID:</strong> {residuo.id_residuo}</li>
          <li><strong>Tipo:</strong> {residuo.tipo}</li>
          <li><strong>Creador:</strong> {residuo.nombre_creador || 'N/A'}</li>
          <li><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</li>
        </ul>
        
        <div className="form-group mb-3">
          <label htmlFor="destino"><strong>Destino del Envío</strong></label>
          <input
            type="text"
            id="destino"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            value={destino}
            onChange={handleDestinoChange}
            placeholder="Ej: Planta de reciclaje Santiago"
            required
          />
          {error && (
            <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill me-1" viewBox="0 0 16 16" style={{ verticalAlign: 'text-bottom' }}>
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer-custom">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleConfirm} className="btn btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm"></span> Confirmando...</>
            ) : (
              'Confirmar Envío'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarEnvioModal;
