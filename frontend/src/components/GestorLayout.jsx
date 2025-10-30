import React from 'react';
import { useLocation } from 'react-router-dom';
import GestorNavbar from './GestorNavbar';
import './Layout.css';

const GestorLayout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/gestor/dashboard';

  return (
    <div className="layout-container">
      <GestorNavbar /> 
      <main className="main-content">
        {children}
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

export default GestorLayout;
