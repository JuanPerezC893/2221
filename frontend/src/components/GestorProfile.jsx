import React, { useState, useEffect } from 'react';
import { getMisResiduos } from '../api/gestor';
import { getMyProfile } from '../api/users'; // Importar la nueva función
import './GestorProfile.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const GestorProfile = () => {
  const [misResiduos, setMisResiduos] = useState([]);
  const [profileData, setProfileData] = useState(null); // Estado para el perfil
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener ambos datos en paralelo
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

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calcular contadores para la tarjeta de resumen
  const totalReclamados = misResiduos.length;
  const totalCompletados = misResiduos.filter(r => r.estado.toLowerCase().trim() === 'entregado').length;
  const totalEnCamino = totalReclamados - totalCompletados;

  return (
    <div className="profile-container">
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
                    <th><i className="bi bi-recycle"></i> Tipo de Residuo</th>
                    <th><i className="bi bi-box-seam"></i> Cantidad</th>
                    <th><i className="bi bi-building"></i> Proyecto</th>
                    <th><i className="bi bi-calendar-event"></i> Fecha de Recolección</th>
                    <th><i className="bi bi-hash"></i> Código de Entrega</th>
                    <th><i className="bi bi-info-circle"></i> Estado</th>
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
