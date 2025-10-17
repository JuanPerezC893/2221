import React from 'react';
import GestorNavbar from './GestorNavbar';
import './Layout.css';

const GestorLayout = ({ children }) => {
  return (
    <div className="layout-container">
      <GestorNavbar /> 
      <main className="main-content">
        {children}
      </main>
      <footer className="footer-custom mt-3">
        <p>© 2025 EcoObra. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default GestorLayout;
