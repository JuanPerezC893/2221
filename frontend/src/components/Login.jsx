import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Hook para leer la URL

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Estado para mensaje de éxito
  const [loading, setLoading] = useState(false);
  const [formValues, handleInputChange] = useForm({
    email: '',
    password: '',
  });

  // Efecto para mostrar mensaje de verificación
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    if (verified === 'true') {
      setSuccessMessage('¡Correo verificado con éxito! Por favor, inicia sesión.');
    } else if (verified === 'already') {
      setSuccessMessage('Tu correo electrónico ya había sido verificado.');
    }
    // Limpiar la URL para que el mensaje no persista si el usuario recarga
    if (verified) {
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const { email, password } = formValues;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage(''); // Limpiar mensaje de éxito al intentar login
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      // El backend ahora puede enviar un mensaje específico si el correo no está verificado
      const specificError = err.response?.data?.message || 'Credenciales inválidas o error al iniciar sesión.';
      setErrorMessage(specificError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-center-container">
          <div className="card login-card-facebook">
            <div className="card-body">
              <h1 className="card-title text-center mb-4 text-white">Iniciar Sesión</h1>
              <form onSubmit={onSubmit}>
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
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
                  <input type="submit" value={loading ? 'Iniciando...' : 'Iniciar Sesión'} className="btn btn-light" disabled={loading} />
                </div>
              </form>
              <div className="text-center mt-3">
                <a href="#" className="text-white d-block mb-2">¿Olvidaste tu contraseña?</a>
                <p className="text-white mb-0">
                  ¿No tienes una cuenta? <a href="/register" className="text-white">Regístrate</a>
                </p>
              </div>
            </div>
          </div>
    </div>
  );
};

export default Login;
