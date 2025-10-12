import React from 'react';
import AddWaste from './AddWaste';
import './ConfirmationModal.css'; // Re-using styles for consistency

const AddWasteModal = ({ isOpen, onClose, onSuccess, proyectos }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <AddWaste isModalMode={true} proyectos={proyectos} onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
};

export default AddWasteModal;
