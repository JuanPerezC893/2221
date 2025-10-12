import React from 'react';
import ProjectForm from './ProjectForm';
import './ConfirmationModal.css'; // Re-using styles for consistency

const AddProjectModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        {/* We pass null for projectId to indicate this is for creating a new project */}
        <ProjectForm projectId={null} onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
};

export default AddProjectModal;
