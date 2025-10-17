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
          <h5 className="modal-title">{title}</h5>
        </div>
        <div className="modal-body">
          <p>{children}</p>
        </div>
        <div className="modal-footer-custom">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmationModal };