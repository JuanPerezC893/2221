import React from 'react';
import '../assets/Auth.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <main className="auth-main">
        {children}
      </main>
      <footer className="auth-footer">
        <p>© 2025 EcObra. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
