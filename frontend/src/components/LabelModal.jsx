
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import ProfessionalLabel from './ProfessionalLabel'; // Importar el componente de etiqueta
import './Label.css'; // Importar los estilos de la etiqueta profesional

const LabelModal = ({ residuo, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');

  useEffect(() => {
    if (residuo && residuo.id_residuo) {
      const urlString = `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/trazabilidad/${residuo.id_residuo}`;
      setQrCodeValue(urlString);

      QRCode.toDataURL(urlString, { errorCorrectionLevel: 'H', width: 200, margin: 2 }, (err, url) => {
        if (err) {
          console.error('Error al generar el código QR en LabelModal:', err);
          setQrCodeDataUrl('');
        } else {
          setQrCodeDataUrl(url);
        }
      });
    } else {
      setQrCodeDataUrl('');
      setQrCodeValue('');
    }
  }, [residuo]);

  if (!residuo) return null;

  const handlePrint = () => {
    const labelElement = document.getElementById('printable-label-modal');
    if (!labelElement) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Imprimir Etiqueta</title>');

    Array.from(document.styleSheets).forEach(styleSheet => {
      if (styleSheet.href) {
        printWindow.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
      } else if (styleSheet.cssRules) {
        printWindow.document.write('<style>');
        Array.from(styleSheet.cssRules).forEach(rule => {
          printWindow.document.write(rule.cssText);
        });
        printWindow.document.write('</style>');
      }
    });

    printWindow.document.write('</head><body>');
    printWindow.document.write(labelElement.outerHTML);
    printWindow.document.write('</body></html>');

    printWindow.document.close();

    // Cierra la ventana solo DESPUÉS de que el diálogo de impresión se haya cerrado.
    printWindow.onafterprint = () => {
      printWindow.close();
    };

    // Llama a imprimir solo DESPUÉS de que toda la página y estilos se hayan cargado.
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

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
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .modal-footer-print {
                display: none;
            }
          }
        `}
      </style>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Etiqueta de Residuo #{residuo.id_residuo}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <ProfessionalLabel 
                id="printable-label-modal"
                residuo={residuo} 
                qrCodeDataUrl={qrCodeDataUrl} 
                qrCodeValue={qrCodeValue} 
              />
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
