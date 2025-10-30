import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css'; // Importar los nuevos estilos

const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  const [isAddProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [isAddWasteModalOpen, setAddWasteModalOpen] = useState(false);

  const openAddProjectModal = () => setAddProjectModalOpen(true);
  const closeAddProjectModal = () => setAddProjectModalOpen(false);

  const openAddWasteModal = () => setAddWasteModalOpen(true);
  const closeAddWasteModal = () => setAddWasteModalOpen(false);

  // We need to pass props to the child component (Dashboard)
  const childrenWithProps = React.cloneElement(children, {
    isAddProjectModalOpen,
    closeAddProjectModal,
    isAddWasteModalOpen,
    closeAddWasteModal,
  });

  return (
    <div className="layout-container">
      <Navbar openAddProjectModal={openAddProjectModal} openAddWasteModal={openAddWasteModal} /> 
      <main className="main-content">
        {childrenWithProps}
      </main>
      {!isDashboard && (
        <footer className="footer-custom mt-3">
          <div className="footer-container">
            {/* Social Icons */}
            <div className="footer-social">
              <div className="footer-social-icons">
                <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                <a href="#" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
                <a href="#" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
                <a href="#" aria-label="Email"><i className="bi bi-envelope"></i></a>
              </div>
            </div>

            {/* Title */}
            <div className="footer-title">
              <h2>EcoObra</h2>
            </div>

            {/* Copyright */}
            <div className="footer-copyright">
              <p>© 2025 EcoObra. Todos los derechos reservados.</p>
            </div>

            {/* Legal Links */}
            <div className="footer-legal">
              <a href="#">Términos de Servicio</a>
              <span>|</span>
              <a href="#">Política de Privacidad</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;