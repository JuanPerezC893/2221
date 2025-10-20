import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResiduoDetalle } from '../api/residuos';
import { reclamarResiduo } from '../api/trazabilidad';
import Toast from './Toast';
import AuthContext from '../context/AuthContext';
import './DetalleResiduo.css';

const DetalleResiduo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [residuo, setResiduo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const fetchDetalle = async () => {
      if (auth.user?.tipo_empresa !== 'gestora') {
        navigate('/login');
        return;
      }
      try {
        const { data } = await getResiduoDetalle(id);
        setResiduo(data);
      } catch (err) {
        setError('No se pudo cargar el detalle del residuo. Es posible que ya no esté disponible.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated) {
        fetchDetalle();
    }
  }, [id, auth, navigate]);

  const handleConfirmarSolicitud = async () => {
    setIsClaiming(true);
    try {
      const { data } = await reclamarResiduo(id);
      setToast({ message: `¡Residuo solicitado exitosamente! Código de entrega: ${data.codigo_entrega}. Serás redirigido al dashboard.`, type: 'success' });
      setTimeout(() => {
        navigate('/gestor/dashboard');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al solicitar el residuo.';
      setToast({ message: errorMessage, type: 'error' });
      setIsClaiming(false);
    }
  };

  if (loading) return <div className="container mt-4"><p>Cargando detalle del residuo...</p></div>;
  if (error) return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>;
  if (!residuo) return null;

  return (
    <>
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
      <div className="container mt-4">
        <div className="card">
          <div className="detalle-residuo-header">
            <h2><i className="bi bi-recycle me-3"></i>Detalle del Residuo a Solicitar</h2>
          </div>
          <div className="card-body p-4">
            <h3 className="card-title mb-4">{residuo.tipo}</h3>
            <ul className="list-group list-group-flush list-group-striped">
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-box me-2"></i><strong>Cantidad</strong></div>
                <span className="ms-2">{residuo.cantidad} {residuo.unidad}</span>
              </li>
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-recycle me-2"></i><strong>Reciclable</strong></div>
                <span className="ms-2">{residuo.reciclable ? 'Sí' : 'No'}</span>
              </li>
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-info-circle me-2"></i><strong>Estado Actual</strong></div>
                <span className="badge bg-warning text-dark ms-2">{residuo.estado}</span>
              </li>
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-building me-2"></i><strong>Empresa Constructora</strong></div>
                <span className="ms-2">{residuo.nombre_empresa_constructora}</span>
              </li>
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-file-earmark-text me-2"></i><strong>Proyecto</strong></div>
                <span className="ms-2">{residuo.nombre_proyecto}</span>
              </li>
              <li className="list-group-item d-flex align-items-center">
                <div><i className="bi bi-geo-alt me-2"></i><strong>Ubicación del Proyecto</strong></div>
                <span className="ms-2">{residuo.ubicacion_proyecto}</span>
              </li>
            </ul>
          </div>
          <div className="card-footer text-center">
            <button 
              className="btn btn-success btn-lg"
              onClick={handleConfirmarSolicitud}
              disabled={isClaiming}
            >
              <i className="bi bi-check-circle me-2"></i>
              {isClaiming ? 'Confirmando...' : 'Confirmar Solicitud'}
            </button>
            <button 
              className="btn btn-secondary btn-lg ms-3" 
              onClick={() => navigate('/gestor/dashboard')}
              disabled={isClaiming}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetalleResiduo;
