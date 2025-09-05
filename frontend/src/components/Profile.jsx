import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import LabelModal from './LabelModal';
import ChangePasswordModal from './ChangePasswordModal'; // Import the new modal

const Profile = () => {
  const { auth, updateUser } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [wastes, setWastes] = useState([]);
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '' });

  useEffect(() => {
    if (!auth.user) return;

    setFormData({ nombre: auth.user.nombre, email: auth.user.email });

    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsRes, wastesRes] = await Promise.all([
          api.get('/proyectos'),
          api.get('/residuos')
        ]);
        setProjects(projectsRes.data);
        setWastes(wastesRes.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del perfil.');
        console.error('Fetch profile data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.user]);

  const handleEdit = () => {
    setFormData({ nombre: auth.user.nombre, email: auth.user.email });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/users/me', formData);
      updateUser(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('No se pudo actualizar el perfil.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Se perderá todo el registro de residuos asociado y los datos de progreso. Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/proyectos/${projectId}`);
        setProjects(projects.filter(p => p.id_proyecto !== projectId));
      } catch (err) {
        setError('Error al eliminar el proyecto.');
        console.error('Delete project error:', err);
      }
    }
  };

  const handleOpenLabelModal = (waste) => {
    setSelectedWaste(waste);
    setIsLabelModalOpen(true);
  };

  const handleCloseLabelModal = () => {
    setIsLabelModalOpen(false);
    setSelectedWaste(null);
  };

  if (!auth.user) {
    return <div className="container mt-4">Cargando perfil...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Left Column for Profile */}
        <div className="col-lg-4 mb-4 mb-lg-0">
          <div className="card h-100">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h2 className="h5 mb-0">Perfil de Usuario</h2>
              {!isEditing && <button className="btn btn-outline-light btn-sm" onClick={handleEdit}>Editar</button>}
            </div>
            <div className="card-body d-flex flex-column">
              {isEditing ? (
                <div className="flex-grow-1">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
              ) : (
                <div className="flex-grow-1">
                  <p><strong>Nombre:</strong> {auth.user.nombre}</p>
                  <p><strong>Email:</strong> {auth.user.email}</p>
                  <p><strong>RUT de la Empresa:</strong> {auth.user.empresa_rut}</p>
                  <p className="mb-0"><strong>Rol:</strong> {auth.user.rol}</p>
                </div>
              )}
              <hr />
              <div className="row text-center mb-3">
                <div className="col">
                  <h5 className="card-title">{loading ? '-' : projects.length}</h5>
                  <p className="card-text text-muted">Proyectos</p>
                </div>
                <div className="col">
                  <h5 className="card-title">{loading ? '-' : wastes.length}</h5>
                  <p className="card-text text-muted">Residuos</p>
                </div>
              </div>
              {!isEditing && (
                <button className="btn btn-secondary w-100" onClick={() => setChangePasswordModalOpen(true)}>Cambiar Contraseña</button>
              )}
            </div>
            {isEditing && (
              <div className="card-footer text-end">
                <button className="btn btn-secondary me-2" onClick={handleCancel}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column for Lists */}
        <div className="col-lg-8">
          {loading ? (
            <div className="card"><div className="card-body text-center"><div className="spinner-border"></div></div></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              {/* Projects Card */}
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h3 className="h5 mb-0">Proyectos</h3>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {projects.length > 0 ? (
                      projects.map(project => (
                        <li key={project.id_proyecto} className="list-group-item d-flex justify-content-between align-items-center">
                          {project.nombre}
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(project.id_proyecto)}>
                            Eliminar
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item">No hay proyectos para mostrar.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Printable Labels Card */}
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h3 className="h5 mb-0">Historial de Etiquetas</h3>
                </div>
                <div className="card-body">
                  {wastes.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>ID Residuo</th>
                            <th>Tipo</th>
                            <th>Proyecto</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {wastes.map(waste => (
                            <tr key={waste.id_residuo}>
                              <td>{waste.id_residuo}</td>
                              <td>{waste.tipo}</td>
                              <td>{waste.nombre_proyecto}</td>
                              <td className="text-end">
                                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenLabelModal(waste)}>
                                  Ver / Imprimir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="p-3 text-muted">No hay residuos registrados para esta empresa.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {isLabelModalOpen && <LabelModal residuo={selectedWaste} onClose={handleCloseLabelModal} />}
      {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
    </div>
  );
};

export default Profile;