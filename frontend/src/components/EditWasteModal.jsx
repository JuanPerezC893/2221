import React from 'react';
import EditWaste from './EditWaste';
import './ConfirmationModal.css'; // Re-using styles for consistency

const EditWasteModal = ({ isOpen, onClose, wasteToEdit, proyectos, onDataChange }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <EditWaste
          wasteToEdit={wasteToEdit}
          proyectos={proyectos}
          onDataChange={onDataChange}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default EditWasteModal;
