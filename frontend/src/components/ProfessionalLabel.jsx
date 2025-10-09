
import React from 'react';
import './Label.css'; // Importar los estilos de la etiqueta

const ProfessionalLabel = ({ residuo, qrCodeDataUrl, qrCodeValue, id }) => {
  if (!residuo) return null;

  return (
    <div id={id} className="label-container">
      <div className="label-header">
        <h4>ETIQUETA DE IDENTIFICACIÓN DE RESIDUO</h4>
        <p>{residuo.nombre_empresa || 'Nombre de Empresa no disponible'}</p>
      </div>
      <div className="label-body">
        <div className="label-section qr-section">
          {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="Código QR" /> : <p>QR no disponible</p>}
          <p className="qr-text">ID: {residuo.id_residuo}</p>
        </div>
        <div className="label-section details-section">
          <div className="detail-item"><strong>TIPO DE RESIDUO:</strong><p>{residuo.tipo}</p></div>
          <div className="detail-item"><strong>CANTIDAD:</strong><p>{residuo.cantidad} {residuo.unidad}</p></div>
          <div className="detail-item"><strong>PROYECTO ORIGEN:</strong><p>{residuo.nombre_proyecto}</p></div>
          <div className="detail-item"><strong>FECHA CREACIÓN:</strong><p>{residuo.fecha_creacion ? new Date(residuo.fecha_creacion).toLocaleDateString() : 'N/A'}</p></div>
          <div className="detail-item"><strong>RECICLABLE:</strong><p>{residuo.reciclable ? 'SÍ' : 'NO'}</p></div>
        </div>
      </div>
      <div className="label-footer">
        <p>Verifique la trazabilidad escaneando el código QR.</p>
        <p className="small">{qrCodeValue}</p>
      </div>
    </div>
  );
};

export default ProfessionalLabel;
