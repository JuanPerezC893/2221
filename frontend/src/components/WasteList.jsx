import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getProyectos } from '../api/proyectos';
import { getResiduos, deleteResiduo } from '../api/residuos';
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
            <ul className="list-group waste-list-scrollable">
              {residuos.length > 0 ? (
                residuos.map((residuo) => (
                  <li key={residuo.id_residuo} className="list-group-item d-flex justify-content-between align-items-center">
                    {residuo.tipo} - {residuo.cantidad} {residuo.unidad}
                    <div>
                      <button onClick={() => navigate(`/edit-residuo/${residuo.id_residuo}`)} className="btn btn-warning btn-sm me-2">Editar</button>
                      <button onClick={() => handleDeleteResiduo(residuo.id_residuo)} className="btn btn-danger btn-sm">Eliminar</button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="list-group-item">No hay residuos para mostrar en este proyecto.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasteList;
