import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { register as registerService } from '../api/auth';

const Register = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValues, handleInputChange] = useForm({
    nombre: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    empresa_rut: '',
    rol: 'usuario',
  });

  const { nombre, email, confirmEmail, password, confirmPassword, empresa_rut } = formValues;

  const handleRutChange = (e) => {
    let value = e.target.value;
    // Limpiar: quitar todo lo que no sea número o K
    let cleaned = value.replace(/[^0-9kK]/gi, '');

    // Truncar a un máximo de 9 caracteres (8 para el cuerpo, 1 para el verificador)
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }

    // Formatear
    let formatted = cleaned;
    if (cleaned.length > 1) {
      const body = cleaned.slice(0, -1);
      const verifier = cleaned.slice(-1);
      formatted = `${body}-${verifier}`;
    }

    // Actualizar el estado usando el manejador original del hook
    handleInputChange({
      target: {
        name: 'empresa_rut',
        value: formatted,
      },
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (email !== confirmEmail) {
      setErrorMessage('Los correos electrónicos no coinciden.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = { nombre, email, password, empresa_rut, rol: 'usuario' };
      await registerService(dataToSend);
      setSuccessMessage('Usuario registrado exitosamente! Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
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
      setLoading(false);
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
                    placeholder="Nombre Empresa"
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
                    type="email"
                    placeholder="Confirmar Email"
                    name="confirmEmail"
                    value={confirmEmail}
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
                    onChange={handleRutChange} // Changed to the new handler
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
              <div className="text-center mt-3">
                <p>
                  ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
