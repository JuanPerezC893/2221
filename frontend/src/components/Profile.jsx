import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { generarInforme } from '../api/proyectos';
import LabelModal from './LabelModal';
import ChangePasswordModal from './ChangePasswordModal';
import CompanyProfile from './CompanyProfile'; // Import new component
import UserRoles from './UserRoles'; // Import new component



const Profile = () => {
  const { auth, updateUser } = useContext(AuthContext);
  
  // Data states
  const [companyData, setCompanyData] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [wastes, setWastes] = useState([]);

  // UI states
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for editing company and user info
  const [formData, setFormData] = useState({
    // User fields
    nombre: '',
    email: '',
    // Company fields
    razon_social: '',
    direccion: '',
  });

  useEffect(() => {
    if (!auth.user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [companyRes, usersRes, projectsRes, wastesRes] = await Promise.all([
          api.get('/empresas/me'),
          api.get('/users'),
          api.get('/proyectos'),
          api.get('/residuos'),
        ]);

        setCompanyData(companyRes.data);
        setUserRoles(usersRes.data);
        setProjects(projectsRes.data);
        setWastes(wastesRes.data);
        
        // Set initial form data after fetching
        setFormData({
          nombre: auth.user.nombre,
          email: auth.user.email,
          razon_social: companyRes.data.razon_social,
          direccion: companyRes.data.direccion,
        });

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
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original state from context and state
    setFormData({
      nombre: auth.user.nombre,
      email: auth.user.email,
      razon_social: companyData.razon_social,
      direccion: companyData.direccion,
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Separar los datos del usuario y de la empresa
      const userUpdatePayload = { nombre: formData.nombre, email: formData.email };
      const companyUpdatePayload = { razon_social: formData.razon_social, direccion: formData.direccion };

      // Realizar ambas actualizaciones en paralelo
      const [userRes, companyRes] = await Promise.all([
        api.put('/users/me', userUpdatePayload),
        api.put('/empresas/me', companyUpdatePayload)
      ]);

      // Actualizar el contexto y el estado local con las respuestas
      updateUser(userRes.data); 
      setCompanyData(companyRes.data);

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('No se pudo actualizar el perfil. Verifique los datos e intente de nuevo.');
    }
  };

  const handleFinishProject = async (projectId) => {
    try {
      const response = await generarInforme(projectId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `InformeFinal-Proyecto-${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al generar el informe del proyecto.');
      console.error('Generate report error:', err);
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

  if (loading) {
    return <div className="container mt-4 text-center"><div className="spinner-border"></div></div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Gestión de Perfil y Empresa</h1>
        {!loading && (
          <div>
            {isEditing ? (
              <>
                <button className="btn btn-secondary me-2" onClick={handleCancel}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleEdit}>Editar Perfil y Empresa</button>
            )}
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {/* Left Column for Company and User Roles */}
        <div className="col-lg-5 mb-4 mb-lg-0">
          <CompanyProfile
            company={companyData}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          <UserRoles users={userRoles} />
        </div>

        {/* Right Column for User-specific info and actions */}
        <div className="col-lg-7">
          {/* Personal Info & Stats Card */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Mi Perfil ({auth.user.rol})</h3>
            </div>
            <div className="card-body">
              {isEditing ? (
                 <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleInputChange} />
                  </div>
              ) : (
                <p><strong>Nombre:</strong> {auth.user.nombre}</p>
              )}
               {isEditing ? (
                 <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
              ) : (
                <p><strong>Email:</strong> {auth.user.email}</p>
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
                <button className="btn btn-secondary w-100" onClick={() => setChangePasswordModalOpen(true)}>
                  Cambiar Contraseña
                </button>
              )}
            </div>
          </div>

          {/* Projects and Labels */}
          <>
              <div className="card mb-4">
                <div className="card-header bg-primary text-white"><h3 className="h5 mb-0">Proyectos</h3></div>
                <div className="card-body">
                  <ul className="list-group">
                    {projects.length > 0 ? (
                      projects.map(project => (
                        <li key={project.id_proyecto} className="list-group-item d-flex justify-content-between align-items-center">
                          {project.nombre}
                          <button className="btn btn-success btn-sm" onClick={() => handleFinishProject(project.id_proyecto)}>Finalizar</button>
                        </li>
                      ))
                    ) : <li className="list-group-item">No hay proyectos para mostrar.</li>}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-header bg-primary text-white"><h3 className="h5 mb-0">Historial de Etiquetas</h3></div>
                <div className="card-body">
                  {wastes.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead><tr><th>ID</th><th>Tipo</th><th>Proyecto</th><th></th></tr></thead>
                        <tbody>
                          {wastes.map(waste => (
                            <tr key={waste.id_residuo}>
                              <td>{waste.id_residuo}</td>
                              <td>{waste.tipo}</td>
                              <td>{waste.nombre_proyecto}</td>
                              <td className="text-end">
                                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenLabelModal(waste)}>Ver / Imprimir</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="p-3 text-muted">No hay residuos registrados.</p>}
                </div>
              </div>
            </>
        </div>
      </div>

      {/* Modals */}
      {isLabelModalOpen && <LabelModal residuo={selectedWaste} onClose={handleCloseLabelModal} />}
      {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
    </div>
  );
};

export default Profile;
