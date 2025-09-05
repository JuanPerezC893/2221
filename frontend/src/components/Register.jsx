import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { register as registerService } from '../api/auth';

const Register = () => {
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [formValues, handleInputChange] = useForm({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '', // Added confirmPassword
    empresa_rut: '',
    rol: 'usuario',
  });

  const { nombre, email, password, confirmPassword, empresa_rut } = formValues; // Destructure confirmPassword

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages
    setLoading(true); // Set loading to true

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      setLoading(false); // Stop loading if passwords don't match
      return;
    }

    try {
      // Only send necessary fields to the API
      const dataToSend = { nombre, email, password, empresa_rut, rol: 'usuario' };
      await registerService(dataToSend);
      setSuccessMessage('Usuario registrado exitosamente! Redirigiendo al login...');
      // Redirigir al login después de un breve retraso para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000); // 2 seconds delay
    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(' ');
        setErrorMessage(`Errores de validación: ${validationErrors}`);
      } else if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Error al registrar usuario. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="auth-card">
        <div className="col-md-6 col-lg-4">
          <div className="card register-card">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Registrarse</h1>
              <form onSubmit={onSubmit}>
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    name="nombre"
                    value={nombre}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    autoComplete="name"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    autoComplete="email"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="Contraseña"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    minLength="8"
                    required
                    className="form-control"
                    autoComplete="new-password"
                  />
                  <small className="form-text text-muted">
                    La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
                  </small>
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    autoComplete="new-password"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="RUT de la empresa"
                    name="empresa_rut"
                    value={empresa_rut}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    autoComplete="organization-id"
                  />
                </div>
                <div className="d-grid">
                  <input
                    type="submit"
                    value={loading ? 'Registrando...' : 'Registrarse'}
                    className="btn btn-primary"
                    disabled={loading}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
