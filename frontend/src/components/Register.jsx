import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { register as registerService } from '../api/auth';
import { checkCompanyByRut } from '../api/empresas';
import { validarRut } from '../utils/validation.js';
import Toast from './Toast';
import './Toast.css';
import AddressAutocomplete from './AddressAutocomplete'; // Import the new component

const Register = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rutError, setRutError] = useState('');

  const [companyExists, setCompanyExists] = useState(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

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
    setCompanyExists(null);
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
    setToast(null);

    if (companyExists === null) {
        if (rutError || !empresa_rut) {
            setToast({ message: 'Por favor, ingrese un RUT de empresa válido para continuar.', type: 'error' });
            return;
        }
        setIsCheckingCompany(true);
        try {
            const { data } = await checkCompanyByRut(empresa_rut);
            setCompanyExists(data.exists);
            if (data.exists) {
                setToast({ message: 'Empresa encontrada. Ahora puedes registrarte.', type: 'info' });
            } else {
                setToast({ message: 'Empresa no encontrada. Completa los datos para registrarla.', type: 'warning' });
            }
        } catch (error) {
            console.error("Error checking company", error);
            setToast({ message: 'Error al verificar la empresa. Inténtalo de nuevo.', type: 'error' });
            setCompanyExists(null);
        } finally {
            setIsCheckingCompany(false);
        }
        return;
    }

    if (email !== confirmEmail) {
      setToast({ message: 'Los correos electrónicos no coinciden.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      let dataToSend = { nombre, email, password, empresa_rut, rol: 'usuario' };
      if (companyExists === false) {
        if (!razon_social || !direccion) {
            setToast({ message: 'La razón social y la dirección son obligatorias para una nueva empresa.', type: 'error' });
            setLoading(false);
            return;
        }
        dataToSend = { ...dataToSend, razon_social, direccion };
      }
      await registerService(dataToSend);
      setToast({ message: '¡Registro exitoso! Redirigiendo al login...', type: 'success' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      console.error(err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Error al registrar usuario. Inténtalo de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
      <div className="container d-flex justify-content-center align-items-center">
        <div className="auth-card">
          <div className="card register-card">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Registrarse</h1>
               <form onSubmit={onSubmit}>
                <p className='text-muted text-center'>Tus Datos</p>
                {/* ... user data inputs ... */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person-fill"></i></span>
                    <input type="text" placeholder="Tu Nombre Completo" name="nombre" value={nombre} onChange={handleInputChange} required className="form-control" autoComplete="name" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope-fill"></i></span>
                    <input type="email" placeholder="Email de Contacto" name="email" value={email} onChange={handleInputChange} required className="form-control" autoComplete="email" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope-check-fill"></i></span>
                    <input type="email" placeholder="Confirmar Email" name="confirmEmail" value={confirmEmail} onChange={handleInputChange} required className="form-control" autoComplete="email" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                    <input type="password" placeholder="Contraseña" name="password" value={password} onChange={handleInputChange} minLength="8" required className="form-control" autoComplete="new-password" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                    <input type="password" placeholder="Confirmar Contraseña" name="confirmPassword" value={confirmPassword} onChange={handleInputChange} required className="form-control" autoComplete="new-password" />
                  </div>
                </div>
                <hr />
                <p className='text-muted text-center'>Datos de la Empresa</p>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i class="bi bi-person-vcard"></i></span>
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
                  </div>
                  {rutError && <div className="invalid-feedback d-block">{rutError}</div>}
                </div>
  
                  {companyExists === false && (
                    <>
                      <div className="mb-3">
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-building"></i></span>
                          <input
                            type="text"
                            placeholder="Nombre Empresa (ej: Constructora S.A.)"
                            name="razon_social"
                            value={razon_social}
                            onChange={handleInputChange}
                            required
                            className="form-control"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-geo-alt-fill"></i></span>
                          <AddressAutocomplete 
                              value={direccion}
                              onValueChange={(value) => handleInputChange({ target: { name: 'direccion', value: value } })}
                              onAddressSelect={(selected) => handleInputChange({ target: { name: 'direccion', value: selected } })}
                              placeholder="Dirección de la empresa"
                              name="direccion"
                              required={true}
                          />
                        </div>
                      </div>
                    </>
                  )}
  
                  <div className="d-grid">
                    <input
                      type="submit"
                      value={companyExists === null ? (isCheckingCompany ? 'Verificando...' : 'Siguiente') : (loading ? 'Registrando...' : 'Registrarse')}
                      className="btn btn-primary"
                      disabled={loading || isCheckingCompany || !!rutError}
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
    </>
  );
};

export default Register;