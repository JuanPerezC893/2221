import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm';
import Toast from './Toast';
import './Toast.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formValues, handleInputChange] = useForm({
    email: '',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    if (verified === 'true') {
      setToast({ message: '¡Correo verificado con éxito! Por favor, inicia sesión.', type: 'success' });
    } else if (verified === 'already') {
      setToast({ message: 'Tu correo electrónico ya había sido verificado.', type: 'info' });
    }
    if (verified) {
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const { email, password } = formValues;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const specificError = err.response?.data?.message || 'Credenciales inválidas o error al iniciar sesión.';
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
                <h1 className="card-title text-center mb-4 text-white">Iniciar Sesión</h1>
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <input
                      type="email"
                      placeholder="Email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                      autoComplete="username"
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      placeholder="Contraseña"
                      name="password"
                      value={password}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="d-grid">
                    <input type="submit" value={loading ? 'Iniciando...' : 'Iniciar Sesión'} className="btn btn-primary" disabled={loading} />
                  </div>
                </form>
                <div className="text-center mt-3">
                  <a href="/forgot-password" className="text-white d-block mb-2">¿Olvidaste tu contraseña?</a>
                  <p className="text-white mb-0">
                    ¿No tienes una cuenta? <a href="/register" className="text-white">Regístrate</a>
                  </p>
                </div>
              </div>
            </div>
      </div>
    </>
  );
};

export default Login;