import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { generarInforme } from '../api/proyectos';
import LabelModal from './LabelModal';
import ChangePasswordModal from './ChangePasswordModal';
import CompanyProfile from './CompanyProfile';
import UserProfile from './UserProfile';
import UserRoles from './UserRoles';
import ProjectWasteTree from './ProjectWasteTree';
import './ProfileTabs.css';

const Profile = () => {
  const { auth, updateUser } = useContext(AuthContext);
  const isAdmin = auth.user?.rol === 'admin';

  // Data states
  const [companyData, setCompanyData] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [wastes, setWastes] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('user');
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [finalizingProjectId, setFinalizingProjectId] = useState(null);

  // Refs for tabs
  const userTabRef = useRef(null);
  const companyTabRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    direccion: '',
  });

  const fetchData = useCallback(async () => {
    if (!auth.user) return;
    setLoading(true);
    try {
      const promises = [
        api.get('/empresas/me'),
        api.get('/users'),
        api.get('/proyectos'),
        api.get('/residuos'),
      ];

      const [companyRes, usersRes, projectsRes, wastesRes] = await Promise.all(promises);

      setCompanyData(companyRes.data);
      setUserRoles(usersRes.data);
      setProjects(projectsRes.data);
      setWastes(wastesRes.data);

      setFormData({
        nombre: auth.user.nombre,
        razon_social: companyRes.data?.razon_social || '',
        direccion: companyRes.data?.direccion || '',
      });

      setError(null);
    } catch (err) {
      setError('Error al cargar los datos del perfil.');
      console.error('Fetch profile data error:', err);
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'user' && userTabRef.current) {
      setIndicatorStyle({ left: userTabRef.current.offsetLeft, width: userTabRef.current.offsetWidth });
    } else if (activeTab === 'company' && companyTabRef.current) {
      setIndicatorStyle({ left: companyTabRef.current.offsetLeft, width: companyTabRef.current.offsetWidth });
    }
  }, [activeTab, loading]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setFormData({
      nombre: auth.user.nombre,
      razon_social: companyData?.razon_social || '',
      direccion: companyData?.direccion || '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'user') {
        const userUpdatePayload = { nombre: formData.nombre };
        const userRes = await api.put('/users/me', userUpdatePayload);
        updateUser(userRes.data);
      } else if (activeTab === 'company' && isAdmin) {
        const companyUpdatePayload = { razon_social: formData.razon_social, direccion: formData.direccion };
        const companyRes = await api.put('/empresas/me', companyUpdatePayload);
        setCompanyData(companyRes.data);
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('No se pudo actualizar el perfil. Verifique los datos e intente de nuevo.');
    }
  };

  const handleFinishProject = async (projectId) => {
    setFinalizingProjectId(projectId);
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
    } finally {
      setFinalizingProjectId(null);
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
      <div className="row">
        <div className="col-lg-5 mb-4 mb-lg-0 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h1 className="h3 mb-0">Perfil</h1>
              <div>
                {isEditing ? (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={handleSave}>Guardar</button>
                    <button className="btn btn-secondary btn-sm" onClick={handleCancel}>Cancelar</button>
                  </>
                ) : (
                  <button className="btn btn-light btn-sm" onClick={handleEdit}>Editar</button>
                )}
              </div>
            </div>
            <div className="card-body d-flex flex-column">
              <div className="nav-tabs-container">
                <div className="nav-tabs-animated">
                  <button
                    ref={userTabRef}
                    className={`nav-link-animated ${activeTab === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveTab('user')}
                  >
                    Personal
                  </button>
                  <button
                    ref={companyTabRef}
                    className={`nav-link-animated ${activeTab === 'company' ? 'active' : ''}`}
                    onClick={() => setActiveTab('company')}
                  >
                    Empresa
                  </button>
                </div>
                <div className="tab-indicator" style={indicatorStyle} />
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}

              <div className="tab-content mt-3 flex-grow-1">
                {activeTab === 'user' && (
                  <UserProfile
                    user={auth.user}
                    isEditing={isEditing}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    projects={projects}
                    wastes={wastes}
                    onOpenChangePassword={() => setChangePasswordModalOpen(true)}
                  />
                )}
                {activeTab === 'company' && companyData && (
                  <CompanyProfile
                    company={companyData}
                    isEditing={isEditing && isAdmin}
                    formData={formData}
                    handleInputChange={handleInputChange}
                  />
                )}
              </div>
            </div>
          </div>
          {isAdmin && <UserRoles users={userRoles} onUsersUpdate={fetchData} />}
        </div>

        <div className="col-lg-7 d-flex flex-column">
          <ProjectWasteTree 
            className="h-100"
            projects={projects}
            wastes={wastes}
            onFinishProject={handleFinishProject}
            onOpenLabelModal={handleOpenLabelModal}
            onDataChange={fetchData}
            finalizingProjectId={finalizingProjectId}
            userRole={auth.user?.rol}
          />
        </div>
      </div>

      {isLabelModalOpen && <LabelModal residuo={selectedWaste} onClose={handleCloseLabelModal} />}
      {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
    </div>
  );
};

export default Profile;
