import React, { useState } from 'react';
import './ConfirmationModal.css'; // Reutilizamos los estilos

const SuccessCodeModal = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500); // El mensaje '¡Copiado!' desaparece después de 2.5s
    });
  };

  const handleCopyAndClose = () => {
    navigator.clipboard.writeText(code);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom" style={{ maxWidth: '450px' }}>
        <div className="modal-header-custom">
          <h2 className="h5">¡Envío Confirmado!</h2>
        </div>
        <div className="text-center my-3">
          <p className="mb-2">Tu código de entrega es:</p>
          <div 
            className="bg-light p-3 rounded mb-3" 
            style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px' }}
          >
            {code}
          </div>
        </div>

        <div className="modal-footer-custom justify-content-between">
          <div>
            <button onClick={handleCopy} className="btn btn-outline-secondary">
              Copiar
            </button>
            {copied && <span className="ms-2 text-success">¡Copiado!</span>}
          </div>
          <div>
            <button onClick={onClose} className="btn btn-secondary me-2">
              Aceptar
            </button>
            <button onClick={handleCopyAndClose} className="btn btn-primary">
              Copiar y Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessCodeModal;
