import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getProyectos } from '../api/proyectos';
import { getResiduos, deleteResiduo, marcarEnCamino } from '../api/residuos';
import './WasteList.css'; // Importar los nuevos estilos

const WasteList = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [residuos, setResiduos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (auth.user) {
        try {
          const res = await getProyectos();
          setProjects(res.data);
          if (res.data.length > 0) {
            setSelectedProject(res.data[0].id_proyecto); // Default to the first project
          }
        } catch (err) {
          console.error("Error fetching projects:", err);
          setError('No se pudieron cargar los proyectos.');
        }
      }
    };
    fetchProjects();
  }, [auth.user]);

  useEffect(() => {
    const fetchResiduos = async () => {
      if (!selectedProject) {
        setResiduos([]);
        return;
      };

      setLoading(true);
      setError(null);
      try {
        const res = await getResiduos(selectedProject);
        setResiduos(res.data);
      } catch (err) {
        console.error("Error fetching waste:", err);
        setError('No se pudieron cargar los residuos para este proyecto.');
      } finally {
        setLoading(false);
      }
    };

    fetchResiduos();
  }, [selectedProject]);

  const handleDeleteResiduo = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este residuo?')) {
        try {
            await deleteResiduo(id);
            setResiduos(residuos.filter(r => r.id_residuo !== id));
        } catch (err) {
            console.error(err.response.data);
            setError('Error al eliminar el residuo.');
        }
    }
  };

  const handleMarcarEnCamino = async (id) => {
    try {
      const updatedResiduo = await marcarEnCamino(id);
      setResiduos(residuos.map(r => 
        r.id_residuo === id ? { ...r, estado: updatedResiduo.data.estado } : r
      ));
    } catch (err) {
      console.error("Error updating status:", err);
      setError('Error al actualizar el estado del residuo.');
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pendiente: 'bg-secondary',
      'en camino': 'bg-primary',
      entregado: 'bg-success',
    };
    return <span className={`badge ${statusStyles[status] || 'bg-dark'}`}>{status}</span>;
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          Lista de Residuos
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="project-select" className="form-label">Filtrar por Proyecto:</label>
            <select 
              id="project-select" 
              className="form-select" 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={projects.length === 0}
            >
              {projects.length > 0 ? (
                projects.map(p => (
                  <option key={p.id_proyecto} value={p.id_proyecto}>
                    {p.nombre}
                  </option>
                ))
              ) : (
                <option>No hay proyectos disponibles</option>
              )}
            </select>
          </div>

          {loading && <p>Cargando residuos...</p>}
          {error && <p className="text-danger">{error}</p>}
          
          {!loading && !error && (
            <div className="table-responsive waste-list-scrollable">
              <table className="table table-hover align-middle">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {residuos.length > 0 ? (
                    residuos.map((residuo) => (
                      <tr key={residuo.id_residuo}>
                        <td>{residuo.tipo}</td>
                        <td>{residuo.cantidad} {residuo.unidad}</td>
                        <td>{getStatusBadge(residuo.estado)}</td>
                        <td className="text-end">
                          {residuo.estado?.trim().toLowerCase() === 'pendiente' && (
                            <>
                              <button onClick={() => handleDeleteResiduo(residuo.id_residuo)} className="btn btn-danger btn-sm me-2" title="Eliminar">Eliminar</button>
                              <button onClick={() => navigate(`/edit-residuo/${residuo.id_residuo}`)} className="btn btn-warning btn-sm me-2" title="Editar">Editar</button>
                              <button onClick={() => handleMarcarEnCamino(residuo.id_residuo)} className="btn btn-info btn-sm" title="Marcar como En Camino">Enviar</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">No hay residuos para mostrar en este proyecto.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasteList;
