
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import ProfessionalLabel from './ProfessionalLabel'; // Importar el componente de etiqueta
import './Label.css'; // Importar los estilos de la etiqueta profesional
import { generarEtiqueta } from '../api/residuos';

const LabelModal = ({ residuo, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleDownloadLabel = async () => {
    if (!residuo?.id_residuo) return;
    setLoading(true);
    setError(null);
    try {
      const response = await generarEtiqueta(residuo.id_residuo);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Etiqueta-Residuo-${residuo.id_residuo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar la etiqueta.');
    } finally {
      setLoading(false);
    }
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
              {error && <div className="alert alert-danger">{error}</div>}
              <ProfessionalLabel 
                id="printable-label-modal"
                residuo={residuo} 
                qrCodeDataUrl={qrCodeDataUrl} 
                qrCodeValue={qrCodeValue} 
              />
            </div>
            <div className="modal-footer modal-footer-print">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              <button type="button" className="btn btn-primary" onClick={handleDownloadLabel} disabled={loading}>
                {loading ? 'Descargando...' : 'Descargar Etiqueta'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default LabelModal;
