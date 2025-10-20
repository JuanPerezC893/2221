import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title"><i className="bi bi-door-open me-2"></i>{title}</h5>
        </div>
        <div className="modal-body">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle me-3" style={{ fontSize: '1.75rem', color: '#dc3545' }}></i>
            <p className="mb-0">{children}</p>
          </div>
        </div>
        <div className="modal-footer-custom">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Sí, cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmationModal };