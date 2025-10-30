import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ResiduoAccordion.css';

const ResiduoAccordion = ({ residuos = [] }) => {
  const navigate = useNavigate();

  const handleNavigateToDetail = (idResiduo) => {
    navigate(`/gestor/residuo/${idResiduo}`);
  };

  if (residuos.length === 0) {
    return <p className="text-center text-muted">No se encontraron residuos con los filtros actuales.</p>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {residuos.map((residuo) => (
          <div className="col-12 col-md-6 col-lg-4 mb-4" key={residuo.id_residuo}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h4 className="card-title fw-bold">{residuo.tipo}</h4>
                <h6 className="card-subtitle mb-2 text-dark">{residuo.nombre_empresa_constructora}</h6>
                <ul className="list-unstyled">
                  <li><i className="bi bi-box me-2"></i><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</li>
                  <li><i className="bi bi-geo-alt me-2"></i><strong>Ciudad:</strong> {residuo.ubicacion_proyecto}</li>
                  <li>
                    <i className="bi bi-recycle me-2"></i><strong>Reciclable:</strong> 
                    <span className={`chip ${residuo.reciclable ? 'chip-success' : 'chip-danger'}`}>
                      {residuo.reciclable ? 'Sí' : 'No'}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="card-footer">
                <button 
                  className="btn btn-reclamar w-100" 
                  onClick={() => handleNavigateToDetail(residuo.id_residuo)}>
                  Ver Detalles y Solicitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResiduoAccordion;