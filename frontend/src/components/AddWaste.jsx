import { useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WasteForm from './WasteForm';
import { getProyectos } from '../api/proyectos';
import { createResiduo } from '../api/residuos';
import { createTrazabilidad } from '../api/trazabilidad';

const AddWaste = () => {
  const { auth, triggerDataRefresh } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: QR, 4: Label
  const [formData, setFormData] = useState({
    tipo: '',
    cantidad: '',
    unidad: 'kg',
    reciclable: true,
    estado: 'Pendiente',
    id_proyecto: '',
  });
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [savedWasteData, setSavedWasteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (auth.user) {
        try {
          setLoading(true);
          const [proyectosRes] = await Promise.all([getProyectos()]);
          setProyectos(proyectosRes.data);
          if (proyectosRes.data.length > 0) {
            setFormData(prev => ({ ...prev, id_proyecto: proyectosRes.data[0].id_proyecto }));
          }
        } catch (err) {
          console.error('Error fetching initial data:', err.response?.data || err.message);
          setError('Error al cargar datos iniciales.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [auth.user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'cantidad' || name === 'id_proyecto' ? (value === '' ? null : Number(value)) : value),
    }));
  };

  const handleSaveWaste = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createResiduo(formData);
      setSavedWasteData(res.data);
      const qrValue = `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/waste/${res.data.id_residuo}`;
      setQrCodeValue(qrValue);
      setStep(2); // Move to confirmation step
    } catch (err) {
      console.error('Error al guardar residuo:', err.response?.data || err.message);
      setError('Error al guardar el residuo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToQRStep = () => {
    setStep(3); // Move to QR generation step
  };

  const handleGenerateQRAndSaveTraceability = async () => {
    setLoading(true);
    setError(null);
    try {
      await createTrazabilidad({
        id_residuo: savedWasteData.id_residuo,
        qr: qrCodeValue,
        ticket: uuidv4(),
      });
      triggerDataRefresh();
      setStep(4); // Move to label visualization step
    } catch (err) {
      console.error('Error al guardar trazabilidad:', err.response?.data || err.message);
      setError('Error al guardar la trazabilidad.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
        tipo: '',
        cantidad: '',
        unidad: 'kg',
        reciclable: true,
        estado: 'Pendiente',
        id_proyecto: proyectos.length > 0 ? proyectos[0].id_proyecto : '',
      });
  }

  if (loading) {
    return <div className="container mt-5">Cargando...</div>;
  }

  if (error) {
    return <div className="container mt-5 text-danger">Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="display-5 fw-bold mb-2 text-center text-dark">Añadir Nuevo Residuo</h1>
      <p className="lead text-muted text-center mb-4">Completa los pasos para registrar un nuevo residuo y generar su código de trazabilidad.</p>

      {step === 1 && (
        <div className="card">
          <div className="card-header bg-primary text-white">Paso 1: Detalles del Residuo</div>
          <div className="card-body">
            <form onSubmit={handleSaveWaste}>
              <WasteForm
                formData={formData}
                handleInputChange={handleInputChange}
                proyectos={proyectos}
              />
              <button type="submit" className="btn btn-primary">Siguiente</button>
            </form>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card text-center">
            <div className="card-header bg-primary text-white">Paso 2: Residuo Guardado</div>
            <div className="card-body">
                <h5 className="card-title">¡Residuo guardado con éxito!</h5>
                
                {/* Mostrar información de conversión si existe */}
                {savedWasteData?.conversion_info && (
                  <div className="alert alert-info mt-3">
                    <h6 className="alert-heading">💡 Conversión de Unidades</h6>
                    <p className="mb-1">{savedWasteData.conversion_info.message}</p>
                    {savedWasteData.conversion_info.unidad_original.toLowerCase() !== 'kg' && (
                      <small className="text-muted">
                        Para mantener consistencia en los cálculos, todas las cantidades se almacenan en kilogramos.
                      </small>
                    )}
                  </div>
                )}
                
                <div className="mt-3">
                  <p><strong>Tipo:</strong> {savedWasteData?.tipo}</p>
                  <p><strong>Cantidad:</strong> {savedWasteData?.cantidad} {savedWasteData?.unidad}</p>
                  <p><strong>Proyecto:</strong> {proyectos.find(p => p.id_proyecto === savedWasteData?.id_proyecto)?.nombre}</p>
                </div>
                
                <p className="mt-3">El siguiente paso es generar el código QR para su trazabilidad.</p>
                <button onClick={handleGoToQRStep} className="btn btn-success">Generar Código QR</button>
            </div>
        </div>
      )}

      {step === 3 && savedWasteData && (
        <div className="card text-center">
          <div className="card-header bg-primary text-white">Paso 3: Generar Código QR</div>
          <div className="card-body">
            <p>Confirma los datos para guardar la trazabilidad.</p>
            <div className="my-3">
              <p className="text-muted">Datos del QR:</p>
              <code className="p-2 bg-light d-block text-break">{qrCodeValue}</code>
            </div>
            <button onClick={handleGenerateQRAndSaveTraceability} className="btn btn-success me-2">Confirmar y Guardar Trazabilidad</button>
            <button onClick={() => setStep(1)} className="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {step === 4 && savedWasteData && (
        <div className="card">
          <div className="card-header bg-primary text-white">Paso 4: Etiqueta de Residuo</div>
          <div className="card-body" id="printable-label">
            <h5 className="card-title">Detalles del Residuo</h5>
            <p><strong>Proyecto:</strong> {proyectos.find(p => p.id_proyecto === savedWasteData.id_proyecto)?.nombre}</p>
            <p><strong>Tipo:</strong> {savedWasteData.tipo}</p>
            <p><strong>Cantidad:</strong> {savedWasteData.cantidad} {savedWasteData.unidad}</p>
            <p><strong>Reciclable:</strong> {savedWasteData.reciclable ? 'Sí' : 'No'}</p>
            <p><strong>Estado:</strong> {savedWasteData.estado}</p>
            <div className="my-3 text-center">
              <p className="text-muted">Datos del QR:</p>
              <code className="p-2 bg-light d-block text-break">{qrCodeValue}</code>
            </div>
          </div>
          <div className="card-footer text-center">
            <button onClick={handlePrintLabel} className="btn btn-info me-2">Imprimir Etiqueta</button>
            <button onClick={resetForm} className="btn btn-secondary">Añadir Otro Residuo</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWaste;
