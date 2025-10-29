import React, { useState, useEffect } from 'react';
import { getMisResiduos } from '../api/gestor';
import { getMyProfile } from '../api/users';
import { uploadCertificate } from '../api/residuos'; // Importar la función de subida
import Toast from './Toast'; // Importar el componente Toast
import './GestorProfile.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const GestorProfile = () => {
  const [misResiduos, setMisResiduos] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState({}); // Para manejar archivos por residuoId
  const [isUploading, setIsUploading] = useState({}); // Para manejar el estado de subida por residuoId
  const [toast, setToast] = useState(null); // Para mostrar mensajes

  const fetchData = async () => {
    try {
      const [profileRes, residuosRes] = await Promise.all([
        getMyProfile(),
        getMisResiduos()
      ]);
      setProfileData(profileRes.data);
      setMisResiduos(residuosRes.data);
    } catch (err) {
      setError('No se pudieron cargar los datos del perfil.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleFileChange = (residuoId, event) => {
    setSelectedFile(prev => ({ ...prev, [residuoId]: event.target.files[0] }));
  };

  const handleUploadCertificate = async (residuoId) => {
    const file = selectedFile[residuoId];
    if (!file) {
      setToast({ message: 'Por favor, selecciona un archivo para subir.', type: 'error' });
      return;
    }
    setIsUploading(prev => ({ ...prev, [residuoId]: true }));
    try {
      await uploadCertificate(residuoId, file);
      setToast({ message: 'Certificado subido exitosamente.', type: 'success' });
      // Refrescar la lista de residuos para mostrar la nueva URL
      await fetchData(); 
      setSelectedFile(prev => {
        const newState = { ...prev };
        delete newState[residuoId];
        return newState;
      }); // Limpiar el archivo seleccionado para este residuo
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al subir el certificado.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsUploading(prev => ({ ...prev, [residuoId]: false }));
    }
  };

  // Calcular contadores para la tarjeta de resumen
  const totalReclamados = misResiduos.length;
  const totalCompletados = misResiduos.filter(r => r.estado.toLowerCase().trim() === 'entregado').length;
  const totalEnCamino = totalReclamados - totalCompletados;

  return (
    <div className="profile-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="profile-summary-grid">
        {/* Tarjeta de Perfil de Empresa (Columna Izquierda) */}
        <div className="profile-info-container">
          {profileData && (
            <div className="card profile-header h-100">
              <h1><i className="bi bi-buildings"></i> {profileData.nombre_empresa}</h1>
              <p className="lead">RUT: {profileData.empresa_rut}</p>
              <hr />
              <p><i className="bi bi-geo-alt-fill"></i> <strong>Dirección:</strong> {profileData.direccion_empresa}</p>
              <p><i className="bi bi-envelope-fill"></i> <strong>Email de Contacto:</strong> {profileData.email}</p>
            </div>
          )}
        </div>

        {/* Tarjeta de Resumen de Actividad (Columna Derecha) */}
        <div className="summary-info-container">
          <div className="card h-100">
            <h2 className="h5"><i className="bi bi-bar-chart-line-fill"></i> Resumen de Actividad</h2>
            <div className="mt-3">
              <p className="d-flex justify-content-between align-items-center">
                <span><i className="bi bi-journal-check"></i> Total Reclamados:</span>
                <strong className="fs-4">{totalReclamados}</strong>
              </p>
              <p className="d-flex justify-content-between align-items-center">
                <span><i className="bi bi-truck-front"></i> En Camino:</span>
                <strong className="fs-4">{totalEnCamino}</strong>
              </p>
              <p className="d-flex justify-content-between align-items-center">
                <span><i className="bi bi-check2-circle"></i> Completados:</span>
                <strong className="fs-4">{totalCompletados}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Residuos Reclamados (Tabla) */}
      <div className="card">
        <h2><i className="bi bi-truck"></i> Mis Residuos Reclamados</h2>
        {loading && <p>Cargando residuos...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && (
          misResiduos.length === 0 ? (
            <p>Aún no has reclamado ningún residuo.</p>
          ) : (
            <div className="table-responsive">
              <table className="waste-table">
                <thead>
                  <tr>
                    <th><i className="bi bi-recycle"></i> Tipo de Residuo</th><th><i className="bi bi-box-seam"></i> Cantidad</th><th><i className="bi bi-building"></i> Proyecto</th><th><i className="bi bi-calendar-event"></i> Fecha de Recolección</th><th><i className="bi bi-hash"></i> Código de Entrega</th><th><i className="bi bi-info-circle"></i> Estado</th><th><i className="bi bi-file-earmark-check"></i> Certificado</th> {/* Nueva columna */}
                  </tr>
                </thead>
                <tbody>
                  {misResiduos.map((residuo) => {
                    const esEstadoFinal = residuo.estado.toLowerCase().trim() === 'entregado';
                    return (
                      <tr key={residuo.id_residuo}>
                        <td>{residuo.tipo}</td>
                        <td>{residuo.cantidad} {residuo.unidad}</td>
                        <td>{residuo.nombre_proyecto}</td>
                        <td>{formatDate(residuo.fecha_recoleccion)}</td>
                        <td><span className="code-badge">{residuo.codigo_entrega}</span></td>
                        <td>
                          <span className={`status-badge ${esEstadoFinal ? 'status-recolectado' : 'status-en-recoleccion'}`}>
                            {esEstadoFinal ? <><i className="bi bi-check-circle-fill"></i> Recolectado</> : residuo.estado}
                          </span>
                        </td>
                        <td>
                          {residuo.estado.toLowerCase().trim() === 'entregado' ? (
                            residuo.url_certificado ? (
                              <a href={residuo.url_certificado} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                Ver <i className="bi bi-box-arrow-up-right ms-1"></i>
                              </a>
                            ) : (
                              <div className="d-flex flex-column align-items-start">
                                <input
                                  type="file"
                                  className="form-control form-control-sm mb-1"
                                  onChange={(e) => handleFileChange(residuo.id_residuo, e)}
                                  accept=".pdf,image/*"
                                  disabled={isUploading[residuo.id_residuo]}
                                />
                                <button
                                  className="btn btn-sm btn-success w-100"
                                  onClick={() => handleUploadCertificate(residuo.id_residuo)}
                                  disabled={!selectedFile[residuo.id_residuo] || isUploading[residuo.id_residuo]}
                                >
                                  {isUploading[residuo.id_residuo] ? 'Subiendo...' : 'Subir Certificado'}
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default GestorProfile;
