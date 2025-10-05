import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css'; // Importar los nuevos estilos

const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="layout-container">
      <Navbar /> 
      <main className="main-content">
        {children}
      </main>
      {!isDashboard && (
        <footer className="footer-custom mt-3">
          <p>© 2025 EcoObra. Todos los derechos reservados.</p>
        </footer>
      )}
    </div>
  );
};

export default Layout;