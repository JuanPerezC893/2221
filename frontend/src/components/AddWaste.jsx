
import { useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import AuthContext from '../context/AuthContext';
import WasteForm from './WasteForm';
import { getProyectos } from '../api/proyectos';
import { createResiduo, generarEtiqueta } from '../api/residuos';
import { createTrazabilidad } from '../api/trazabilidad';
import ProfessionalLabel from './ProfessionalLabel'; // Importar el componente de etiqueta
import './Label.css'; // Importar CSS para la etiqueta

const AddWaste = () => {
  const { auth, triggerDataRefresh } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo: '',
    cantidad: '',
    unidad: 'kg',
    reciclable: true,
    estado: 'Pendiente',
    id_proyecto: '',
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
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
          const res = await getProyectos();
          setProyectos(res.data);
          if (res.data.length > 0) {
            setFormData(prev => ({ ...prev, id_proyecto: res.data[0].id_proyecto }));
          }
        } catch (err) {
          setError('Error al cargar proyectos.');
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveWaste = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createResiduo(formData);
      // El objeto completo, incluyendo fecha_creacion, viene en res.data
      const fullWasteData = {
        ...res.data,
        nombre_proyecto: proyectos.find(p => p.id_proyecto === res.data.id_proyecto)?.nombre || 'N/A',
        nombre_empresa: auth.user.nombre_empresa || 'N/A'
      };
      setSavedWasteData(fullWasteData);
      
      const urlString = `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/trazabilidad/${res.data.id_residuo}`;
      setQrCodeValue(urlString);

      const dataUrl = await QRCode.toDataURL(urlString, { errorCorrectionLevel: 'H', width: 200, margin: 2 });
      setQrCodeDataUrl(dataUrl);

      setStep(2);
    } catch (err) {
      setError('Error al guardar el residuo.');
    } finally {
      setLoading(false);
    }
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
      setStep(4);
    } catch (err) {
      setError('Error al guardar la trazabilidad.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!savedWasteData?.id_residuo) return;
    setLoading(true);
    setError(null);
    try {
      const response = await generarEtiqueta(savedWasteData.id_residuo);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Etiqueta-Residuo-${savedWasteData.id_residuo}.pdf`);
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

  if (loading && step === 1) {
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
        <div className="card"><div className="card-header bg-primary text-white">Paso 1: Detalles del Residuo</div><div className="card-body"><form onSubmit={handleSaveWaste}><WasteForm formData={formData} handleInputChange={handleInputChange} proyectos={proyectos} /><button type="submit" className="btn btn-primary">Siguiente</button></form></div></div>
      )}

      {step === 2 && (
        <div className="card text-center"><div className="card-header bg-primary text-white">Paso 2: Residuo Guardado</div><div className="card-body"><h5 className="card-title">¡Residuo guardado con éxito!</h5><div className="mt-3"><p><strong>Tipo:</strong> {savedWasteData?.tipo}</p><p><strong>Cantidad:</strong> {savedWasteData?.cantidad} {savedWasteData?.unidad}</p><p><strong>Proyecto:</strong> {savedWasteData?.nombre_proyecto}</p></div><p className="mt-3">El siguiente paso es generar el código QR para su trazabilidad.</p><button onClick={() => setStep(3)} className="btn btn-success">Generar Código QR</button></div></div>
      )}

      {step === 3 && savedWasteData && (
        <div className="card text-center"><div className="card-header bg-primary text-white">Paso 3: Generar Código QR</div><div className="card-body"><p>Confirma los datos para guardar la trazabilidad.</p><div className="my-3">{qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="Código QR" /> : <p className="text-danger">Generando QR...</p>}</div><button onClick={handleGenerateQRAndSaveTraceability} className="btn btn-success me-2">Confirmar y Guardar Trazabilidad</button><button onClick={() => setStep(1)} className="btn btn-secondary">Cancelar</button></div></div>
      )}

      {step === 4 && savedWasteData && (
        <div className="card">
          <div className="card-header bg-primary text-white">Paso 4: Etiqueta de Residuo</div>
          <div className="card-body">
            <ProfessionalLabel 
              id="printable-label"
              residuo={savedWasteData} 
              qrCodeDataUrl={qrCodeDataUrl} 
              qrCodeValue={qrCodeValue} 
            />
          </div>
          <div className="card-footer text-center">
            <button onClick={handleDownloadLabel} className="btn btn-info me-2" disabled={loading}>
              {loading ? 'Descargando...' : 'Descargar Etiqueta'}
            </button>
            <button onClick={resetForm} className="btn btn-secondary">Añadir Otro Residuo</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWaste;
