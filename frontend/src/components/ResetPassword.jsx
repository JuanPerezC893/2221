import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import Toast from './Toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ password: '', password2: '' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const { password, password2 } = passwords;

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      setToast({ message: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const { data } = await resetPassword(token, { password, password2 });
      setToast({ message: data.message, type: 'success' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const specificError = err.response?.data?.message || 'Error al restablecer la contraseña.';
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
            <h1 className="card-title text-center mb-4 text-white">Crear Nueva Contraseña</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="password"
                  placeholder="Nueva Contraseña"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  placeholder="Confirmar Nueva Contraseña"
                  name="password2"
                  value={password2}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
