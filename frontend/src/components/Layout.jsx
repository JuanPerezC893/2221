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
          <p>© 2025 EcoObra. Todos los derechos reservados.</p>
        </footer>
      )}
    </div>
  );
};

export default Layout;