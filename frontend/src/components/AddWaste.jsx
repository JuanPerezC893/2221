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

const AddWaste = ({ isModalMode = false, proyectos: proyectosProp, onSuccess, onClose }) => {
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
  const [proyectos, setProyectos] = useState(proyectosProp || []);

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if projects are not provided as a prop
      if (!proyectosProp && auth.user) {
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
  }, [auth.user, proyectosProp]);

  useEffect(() => {
    // Set initial project if projects are passed as props
    if (proyectosProp && proyectosProp.length > 0) {
        setFormData(prev => ({ ...prev, id_proyecto: proyectosProp[0].id_proyecto }));
    }
  }, [proyectosProp]);


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
      if (onSuccess) {
        onSuccess();
      }
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

  const handleCancel = () => {
    if (isModalMode) {
      onClose();
    } else {
      setStep(1);
    }
  }



  if (error) {
    return <div className="container mt-5 text-danger">Error: {error}</div>;
  }

  const renderStepContent = (stepToRender) => {
    if (stepToRender === 1) {
      return (
        <div className={isModalMode ? '' : 'card'}>
          <div className={`card-header bg-primary text-white ${isModalMode ? 'd-none' : ''}`}>Paso 1: Detalles del Residuo</div>
          <div className={isModalMode ? '' : 'card-body'}>
            <form onSubmit={handleSaveWaste}>
              <WasteForm formData={formData} handleInputChange={handleInputChange} proyectos={proyectos} />
              <div className="d-flex justify-content-end mt-3">
                <button type="button" onClick={handleCancel} className="btn btn-secondary me-2">Cancelar</button>
                <button type="submit" className="btn btn-primary">Siguiente</button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    if (stepToRender === 2 && savedWasteData) {
      return (
        <div className={isModalMode ? '' : 'card'} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className={`card-header bg-primary text-white ${isModalMode ? 'd-none' : ''}`}>Paso 2: Confirmar y Generar QR</div>
          <div className={isModalMode ? '' : 'card-body'} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Top Section: Texts */}
            <div className="text-center">
              <h5 className="card-title">¡Residuo guardado con éxito!</h5>
              <p>Confirma los datos para guardar la trazabilidad.</p>
            </div>

            {/* Bottom Section: Columns */}
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '1rem' }}>
              {/* Left Column: QR Code */}
              <div style={{ flex: 1, paddingRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
                {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="Código QR" /> : <p className="text-danger">Generando QR...</p>}
              </div>
              {/* Right Column: Waste Info */}
              <div style={{ flex: 1, paddingLeft: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p><strong>Tipo:</strong> {savedWasteData?.tipo}</p>
                <p><strong>Cantidad:</strong> {savedWasteData?.cantidad} {savedWasteData?.unidad}</p>
                <p><strong>Proyecto:</strong> {savedWasteData?.nombre_proyecto}</p>
              </div>
            </div>
          </div>
          {/* Footer: Buttons */}
          <div className="card-footer d-flex justify-content-end">
            <button onClick={handleCancel} className="btn btn-secondary me-2">Cancelar</button>
            <button onClick={handleGenerateQRAndSaveTraceability} className="btn btn-success">Confirmar y Guardar Trazabilidad</button>
          </div>
        </div>
      );
    }
    if (stepToRender === 4 && savedWasteData) {
      return (
        <div className={isModalMode ? '' : 'card'} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className={`card-header bg-primary text-white ${isModalMode ? 'd-none' : ''}`}>Paso 4: Etiqueta de Residuo</div>
          <div className={isModalMode ? '' : 'card-body'} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center', height: '290px' }}>
              <ProfessionalLabel 
                id="printable-label"
                residuo={savedWasteData} 
                qrCodeDataUrl={qrCodeDataUrl} 
                qrCodeValue={qrCodeValue} 
              />
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end">
            <button onClick={handleDownloadLabel} className="btn btn-info me-2" disabled={loading}>
              {loading ? 'Descargando...' : 'Descargar Etiqueta'}
            </button>
            <button onClick={resetForm} className="btn btn-secondary me-2">Añadir Otro Residuo</button>
            {isModalMode && <button onClick={onClose} className="btn btn-primary">Finalizar</button>}
          </div>
        </div>
      );
    }
    return null;
  };

  const content = (
    <>
      <h1 className="display-5 fw-bold mb-2 text-center text-dark">Añadir Nuevo Residuo</h1>
      <p className="lead text-muted text-center mb-4">Completa los pasos para registrar un nuevo residuo y generar su código de trazabilidad.</p>
      <div style={{ position: 'relative' }}>
        <div style={{ visibility: 'hidden' }}>
          {renderStepContent(1)}
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {renderStepContent(step)}
        </div>
      </div>
    </>
  );

  return isModalMode ? content : <div className="container mt-4">{content}</div>;
};

export default AddWaste;
