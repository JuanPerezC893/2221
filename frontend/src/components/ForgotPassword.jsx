import React, { useState } from 'react';
import { forgotPassword } from '../api/auth';
import Toast from './Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const { data } = await forgotPassword({ email });
      setToast({ message: data.message, type: 'success' });
    } catch (err) {
      const specificError = err.response?.data?.message || 'Error al procesar la solicitud.';
      setToast({ message: specificError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
      <div className="login-page-center-container">
        <div className="card login-card-facebook">
          <div className="card-body">
            <h1 className="card-title text-center mb-4 text-white">Restablecer Contraseña</h1>
            <p className="text-center text-white">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope-fill"></i></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>
             <div className="text-center mt-3">
                  <p className="text-white mb-0">
                    ¿Ya recordaste? <a href="/login" className="text-white">Inicia Sesión</a>
                  </p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
