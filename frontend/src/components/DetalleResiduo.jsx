import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResiduoDetalle } from '../api/residuos';
import { reclamarResiduo } from '../api/trazabilidad';
import Toast from './Toast';
import AuthContext from '../context/AuthContext';

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

  const handleConfirmarReclamo = async () => {
    setIsClaiming(true);
    try {
      const { data } = await reclamarResiduo(id);
      setToast({ message: `¡Residuo reclamado exitosamente! Código de entrega: ${data.codigo_entrega}. Serás redirigido al dashboard.`, type: 'success' });
      setTimeout(() => {
        navigate('/gestor/dashboard');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al reclamar el residuo.';
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
          <div className="card-header bg-success text-white">
            <h2>Detalle del Residuo a Reclamar</h2>
          </div>
          <div className="card-body">
            <h3 className="card-title mb-3">{residuo.tipo}</h3>
            <ul className="list-group list-group-flush">
              <li className="list-group-item"><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</li>
              <li className="list-group-item"><strong>Reciclable:</strong> {residuo.reciclable ? 'Sí' : 'No'}</li>
              <li className="list-group-item"><strong>Estado Actual:</strong> <span className="badge bg-warning text-dark">{residuo.estado}</span></li>
              <li className="list-group-item"><strong>Empresa Constructora:</strong> {residuo.nombre_empresa_constructora}</li>
              <li className="list-group-item"><strong>Proyecto:</strong> {residuo.nombre_proyecto}</li>
              <li className="list-group-item"><strong>Ubicación del Proyecto:</strong> {residuo.ubicacion_proyecto}</li>
            </ul>
          </div>
          <div className="card-footer text-center">
            <button 
              className="btn btn-success btn-lg"
              onClick={handleConfirmarReclamo}
              disabled={isClaiming}
            >
              {isClaiming ? 'Confirmando...' : 'Confirmar Reclamo'}
            </button>
            <button 
              className="btn btn-secondary btn-lg ms-3" 
              onClick={() => navigate('/gestor/dashboard')}
              disabled={isClaiming}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetalleResiduo;
