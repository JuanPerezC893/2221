import React from 'react';
import { Link } from 'react-router-dom';

const VerificationFailed = () => {
  return (
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card text-center" style={{ maxWidth: '450px' }}>
        <div className="card-body">
          <h1 className="card-title text-danger">Verificación Fallida</h1>
          <p className="card-text">
            El enlace de verificación no es válido o ha expirado.
          </p>
          <p>
            Por favor, intenta registrarte de nuevo o contacta con el soporte si el problema persiste.
          </p>
          <Link to="/register" className="btn btn-primary">Volver al Registro</Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationFailed;
