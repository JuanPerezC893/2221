import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [formValues, handleInputChange] = useForm({
    email: '',
    password: '',
  });

  const { email, password } = formValues;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true
    setErrorMessage(''); // Clear previous errors
    try {
      await login(email, password); // Usar directamente la función del contexto
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMessage('Credenciales inválidas o error al iniciar sesión.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="login-page-center-container">
          <div className="card login-card-facebook">
            <div className="card-body">
              <h1 className="card-title text-center mb-4 text-white">Iniciar Sesión</h1>
              <form onSubmit={onSubmit}>
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
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
              <p className="text-center mt-3 text-white">
                ¿No tienes una cuenta? <a href="/register" className="text-white">Regístrate</a>
              </p>
            </div>
          </div>
    </div>
  );
};

export default Login;
