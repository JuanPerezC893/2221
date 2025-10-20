import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import ModeContext from '../context/ModeContext.jsx'; // Importar ModeContext
import { useForm } from '../hooks/useForm';
import Toast from './Toast';
import './Toast.css';

const Login = () => {
  const { login, logout } = useContext(AuthContext);
  const { mode, setMode } = useContext(ModeContext); // Usar el modo y el setter globales
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

  const toggleMode = (e) => {
    e.preventDefault();
    setMode(prevMode => prevMode === 'constructora' ? 'gestora' : 'constructora');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const user = await login(email, password);

      if (user.tipo_empresa !== mode) {
        logout();
        setToast({ message: `Tu perfil es de "${user.tipo_empresa}", no de "${mode}".`, type: 'error' });
        setLoading(false);
        return;
      }

      if (user.tipo_empresa === 'gestora') {
        navigate('/gestor/dashboard');
      } else {
        navigate('/dashboard');
      }

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
            <div className={`card ${mode === 'gestora' ? 'login-card-gestor' : 'login-card-constructora'}`}>
              <div className="card-body">
                <div className="text-center mb-4">
                  <h1 className="card-title">{mode === 'constructora' ? 'Acceso Constructora' : 'Acceso Gestor'}</h1>
                  <p>{mode === 'constructora' ? 'Inicia sesión para gestionar tus obras y residuos.' : 'Inicia sesión para gestionar la recolección de residuos.'}</p>
                </div>
                <form onSubmit={onSubmit}>
                  {/* ... form inputs ... */}
                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope-fill"></i></span>
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
                  </div>
                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
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
                  </div>
                  <div className="d-grid">
                    <input type="submit" value={loading ? 'Iniciando...' : 'Iniciar Sesión'} className="btn btn-primary" disabled={loading} />
                  </div>
                </form>
                <div className="text-center mt-3">
                  <a href="/forgot-password" className="d-block mb-2">¿Olvidaste tu contraseña?</a>
                  <p className="mb-0">
                    ¿No tienes una cuenta? <Link to="/register" className="fw-bold">Regístrate</Link>
                  </p>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <button className="btn btn-mode-switch" onClick={toggleMode}>
                    {mode === 'constructora' ? (
                      <><i className="bi bi-truck me-2"></i>Cambiar a Gestor</>
                    ) : (
                      <><i className="bi bi-briefcase me-2"></i>Cambiar a Constructora</>
                    )}
                  </button>
                </div>

              </div>
            </div>
      </div>
    </>
  );
};

export default Login;