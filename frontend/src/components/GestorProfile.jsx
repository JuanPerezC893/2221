import React, { useState, useEffect } from 'react';
import { getMisResiduos } from '../api/gestor';

const GestorProfile = () => {
  const [misResiduos, setMisResiduos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMisResiduos = async () => {
      try {
        const { data } = await getMisResiduos();
        setMisResiduos(data);
      } catch (err) {
        setError('No se pudieron cargar tus residuos reclamados.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMisResiduos();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Perfil de Gestor</h2>
        </div>
        <div className="card-body">
          <p>Aquí se mostrará la información del perfil del gestor.</p>
          <hr />
          <h4>Mis Residuos Reclamados</h4>
          {loading && <p>Cargando residuos...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && (
            misResiduos.length === 0 ? (
              <p>Aún no has reclamado ningún residuo.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Tipo de Residuo</th>
                      <th>Cantidad</th>
                      <th>Proyecto</th>
                      <th>Fecha de Recolección</th>
                      <th>Código de Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misResiduos.map((residuo) => (
                      <tr key={residuo.id_residuo}>
                        <td>{residuo.tipo}</td>
                        <td>{residuo.cantidad} {residuo.unidad}</td>
                        <td>{residuo.nombre_proyecto}</td>
                        <td>{formatDate(residuo.fecha_recoleccion)}</td>
                        <td><strong>{residuo.codigo_entrega}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default GestorProfile;
