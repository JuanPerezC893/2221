import React from 'react';
import Navbar from './Navbar';
import './Layout.css'; // Importar los nuevos estilos

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Navbar /> 
      <main className="main-content">
        {children}
      </main>
      <footer className="footer-custom">
        <p>© 2025 EcObra. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;