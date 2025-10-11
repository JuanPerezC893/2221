import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { register as registerService } from '../api/auth';
import { checkCompanyByRut } from '../api/empresas';
import { validarRut } from '../utils/validation.js';

const Register = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [rutError, setRutError] = useState('');

  const [formValues, handleInputChange, setFormValues] = useForm({
    nombre: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    empresa_rut: '',
    razon_social: '',
    direccion: '',
    rol: 'usuario',
  });

  const { nombre, email, confirmEmail, password, confirmPassword, empresa_rut, razon_social, direccion } = formValues;

  const handleRutChange = (e) => {
    let value = e.target.value;
    let cleaned = value.replace(/[^0-9kK]/gi, '');

    if (cleaned) {
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        value = `${formattedBody}-${dv}`;
    } else {
        value = '';
    }

    setFormValues(prev => ({ ...prev, empresa_rut: value }));

    if (value && !validarRut(value)) {
        setRutError('El RUT de la empresa no es válido.');
    } else {
        setRutError('');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (rutError) {
      setErrorMessage('Por favor, corrige el RUT antes de continuar.');
      return;
    }

    if (email !== confirmEmail) {
      setErrorMessage('Los correos electrónicos no coinciden.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if company exists
      const { data: companyCheck } = await checkCompanyByRut(empresa_rut);
      const companyExists = companyCheck.exists;

      let dataToSend = { nombre, email, password, empresa_rut, rol: 'usuario' };

      // 2. Validate fields based on whether company is new
      if (companyExists === false) {
        if (!razon_social || !direccion) {
            setErrorMessage('La razón social y la dirección son obligatorias para una nueva empresa.');
            setLoading(false);
            return;
        }
        dataToSend = { ...dataToSend, razon_social, direccion };
      }
      
      // 3. Register the user
      await registerService(dataToSend);
      setSuccessMessage('¡Registro exitoso! Por favor, revisa tu correo para verificar la cuenta.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);

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
        <div className="card register-card">
          <div className="card-body">
            <h1 className="card-title text-center mb-4">Registrarse</h1>
             <form onSubmit={onSubmit}>
              {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
              {successMessage && <div className="alert alert-success">{successMessage}</div>}
                
              <p className='text-muted text-center'>Tus Datos</p>
              <div className="mb-3">
                <input type="text" placeholder="Tu Nombre Completo" name="nombre" value={nombre} onChange={handleInputChange} required className="form-control" autoComplete="name" />
              </div>
              <div className="mb-3">
                <input type="email" placeholder="Email de Contacto" name="email" value={email} onChange={handleInputChange} required className="form-control" autoComplete="email" />
              </div>
              <div className="mb-3">
                <input type="email" placeholder="Confirmar Email" name="confirmEmail" value={confirmEmail} onChange={handleInputChange} required className="form-control" autoComplete="email" />
              </div>
              <div className="mb-3">
                <input type="password" placeholder="Contraseña" name="password" value={password} onChange={handleInputChange} minLength="8" required className="form-control" autoComplete="new-password" />
              </div>
              <div className="mb-3">
                <input type="password" placeholder="Confirmar Contraseña" name="confirmPassword" value={confirmPassword} onChange={handleInputChange} required className="form-control" autoComplete="new-password" />
              </div>
                
              <hr />
              <p className='text-muted text-center'>Datos de la Empresa</p>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="RUT de la empresa"
                  name="empresa_rut"
                  value={empresa_rut}
                  onChange={handleRutChange}
                  required
                  className={`form-control ${rutError ? 'is-invalid' : ''}`}
                  autoComplete="organization-id"
                />
                {rutError && <div className="invalid-feedback">{rutError}</div>}
              </div>

              {/* Fields for new company are always visible for simplicity */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Razón Social (ej: Constructora S.A.)"
                  name="razon_social"
                  value={razon_social}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Dirección de la empresa"
                  name="direccion"
                  value={direccion}
                  onChange={handleInputChange}
                  className="form-control"
                  autoComplete="street-address"
                />
              </div>

              <div className="d-grid">
                  <input
                    type="submit"
                    value={loading ? 'Registrando...' : 'Registrarse'}
                    className="btn btn-primary"
                    disabled={loading || !!rutError}
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
  );
};

export default Register;
