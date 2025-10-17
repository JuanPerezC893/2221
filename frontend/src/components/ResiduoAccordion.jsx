import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResiduoAccordion = ({ residuos }) => {
  const navigate = useNavigate();

  const handleNavigateToDetail = (idResiduo) => {
    navigate(`/gestor/residuo/${idResiduo}`);
  };

  if (residuos.length === 0) {
    return <p className="text-center text-muted">No se encontraron residuos con los filtros actuales.</p>;
  }

  return (
    <div className="accordion" id="residuoAccordion">
      {residuos.map((residuo, index) => (
        <div className="accordion-item" key={residuo.id_residuo}>
          <h2 className="accordion-header" id={`heading-${residuo.id_residuo}`}>
            <button 
              className="accordion-button collapsed" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target={`#collapse-${residuo.id_residuo}`} 
              aria-expanded="false" 
              aria-controls={`collapse-${residuo.id_residuo}`}>
              <span className="fw-bold me-2">{residuo.tipo}</span>
              <span className="text-muted">- {residuo.nombre_empresa_constructora}</span>
            </button>
          </h2>
          <div 
            id={`collapse-${residuo.id_residuo}`} 
            className="accordion-collapse collapse" 
            aria-labelledby={`heading-${residuo.id_residuo}`} 
            data-bs-parent="#residuoAccordion">
            <div className="accordion-body">
              <div className="row">
                <div className="col-md-8">
                  <ul className="list-unstyled">
                    <li><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</li>
                    <li><strong>Ciudad:</strong> {residuo.ubicacion_proyecto}</li>
                    <li><strong>Proyecto:</strong> {residuo.nombre_proyecto}</li>
                    <li><strong>Reciclable:</strong> {residuo.reciclable ? 'Sí' : 'No'}</li>
                  </ul>
                </div>
                <div className="col-md-4 d-flex align-items-center justify-content-end">
                  <button 
                    className="btn btn-info" 
                    onClick={() => handleNavigateToDetail(residuo.id_residuo)}>
                    Ver Detalles y Reclamar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResiduoAccordion;
