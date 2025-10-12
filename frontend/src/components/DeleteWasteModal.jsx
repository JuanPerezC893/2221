import React from 'react';
import './ConfirmationModal.css';

const DeleteWasteModal = ({ isOpen, onClose, onConfirm, wasteToDelete }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">Confirmar Eliminación</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <p>¿Está seguro de que desea eliminar el residuo "{wasteToDelete?.tipo}"?</p>
          <p className="text-danger">Esta acción no se puede deshacer.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteWasteModal;
