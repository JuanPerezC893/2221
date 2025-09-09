import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">EcObra</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/residuos">Residuos</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/agregar-residuo">Agregar Residuo</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/agregar-proyecto">Agregar Proyecto</Link>
            </li>
            
          </ul>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {auth.user && (
              <li className="nav-item">
                <Link className="nav-link" to="/perfil">Hola, {auth.user.nombre}</Link>
              </li>
            )}
            <li className="nav-item">
              <button className="btn btn-link nav-link" onClick={handleLogout}>Cerrar Sesión</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;