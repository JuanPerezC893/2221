import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const GestorNavbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success"> {/* Color verde para gestor */}
      <div className="container-fluid">
        <span className="navbar-brand">EcoObra - Gestor</span>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavGestor" aria-controls="navbarNavGestor" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-between" id="navbarNavGestor">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/gestor/dashboard"><i className="bi bi-grid-1x2 me-2"></i>Dashboard</Link>
            </li>
            {/* Aquí se podrían añadir futuros enlaces para el gestor, como "Mis Recolecciones" */}
          </ul>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {auth.user && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/perfil"><i className="bi bi-person-circle me-2"></i>Hola, {auth.user.nombre}</Link>
              </li>
            )}
            <li className="nav-item">
              <button className="btn btn-link nav-link d-flex align-items-center" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default GestorNavbar;
