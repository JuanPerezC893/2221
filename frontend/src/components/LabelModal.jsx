import React from 'react';

const LabelModal = ({ residuo, onClose }) => {
  if (!residuo) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrCodeValue = `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/waste/${residuo.id_residuo}`;

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-label-modal, #printable-label-modal * {
              visibility: visible;
            }
            #printable-label-modal {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .modal-footer-print {
                display: none;
            }
          }
        `}
      </style>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Etiqueta de Residuo #{residuo.id_residuo}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body" id="printable-label-modal">
              <h5 className="card-title text-center mb-4">Detalles del Residuo</h5>
              <p><strong>Proyecto:</strong> {residuo.nombre_proyecto}</p>
              <p><strong>Tipo:</strong> {residuo.tipo}</p>
              <p><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</p>
              <p><strong>Reciclable:</strong> {residuo.reciclable ? 'Sí' : 'No'}</p>
              <p><strong>Estado:</strong> {residuo.estado}</p>
              <div className="my-3 text-center">
                {/* We still have the qrcode.react issue, so we'll show the text for now */}
                <p className="text-muted">Datos del QR:</p>
                <code className="p-2 bg-light d-block text-break">{qrCodeValue}</code>
              </div>
            </div>
            <div className="modal-footer modal-footer-print">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>Imprimir</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default LabelModal;