import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

const Navbar = ({ openAddProjectModal, openAddWasteModal }) => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
    setIsLogoutModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">EcoObra</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/dashboard"><i className="bi bi-grid-1x2 me-2"></i>Dashboard</Link>
              </li>
              {location.pathname !== '/perfil' && (
                <>
                  <li className="nav-item">
                    <button className="btn btn-link nav-link d-flex align-items-center" onClick={openAddProjectModal}><i className="bi bi-building-add me-2"></i>Agregar Proyecto</button>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-link nav-link d-flex align-items-center" onClick={openAddWasteModal}><i className="bi bi-plus-lg me-2"></i>Agregar Residuo</button>
                  </li>
                </>
              )}
            </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {auth.user && (
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center" to="/perfil"><i className="bi bi-person-circle me-2"></i>Hola, {auth.user.nombre}</Link>
                </li>
              )}
              <li className="nav-item">
                <button className="btn btn-link nav-link d-flex align-items-center" onClick={handleLogoutClick}><i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        title="Confirmar cierre de sesión"
      >
        ¿Estás seguro de que quieres cerrar sesión?
      </ConfirmationModal>
    </>
  );
};

export default Navbar;