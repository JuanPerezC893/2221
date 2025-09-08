import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { getProyecto, createProyecto, updateProyecto } from '../api/proyectos';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, triggerDataRefresh } = useContext(AuthContext);
  const [formValues, handleInputChange, setValues] = useForm({
    nombre: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(''); // State for success message

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        setLoading(true);
        try {
          const res = await getProyecto(id);
          setValues(res.data);
        } catch (err) {
          console.error(err.response.data);
          setError('Error al cargar el proyecto.');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, setValues]);

  const { nombre, ubicacion, fecha_inicio, fecha_fin } = formValues;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(''); // Clear previous success messages

    try {
      if (id) {
        await updateProyecto(id, formValues);
        setSuccessMessage('¡Proyecto actualizado exitosamente!');
      } else {
        await createProyecto(formValues);
        setSuccessMessage('¡Proyecto creado exitosamente!');
      }
      triggerDataRefresh(); // Trigger refresh after successful operation
      
      // Navigate after a short delay to show the message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); // 2-second delay

    } catch (err) {
      console.error('Error guardando el proyecto:', err.response?.data || err.message);
      setError('Error guardando el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  // Do not render the form if we are showing a success message and redirecting
  if (successMessage) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
        <p>Serás redirigido en unos segundos...</p>
      </div>
    );
  }

  if (loading) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="display-5 fw-bold mb-2">{id ? 'Editar Proyecto Existente' : 'Crear Nuevo Proyecto de Gestión'}</h1>
      <p className="lead text-muted text-center mb-4">
        {id ? 'Modifica los detalles de tu proyecto de gestión de residuos.' : 'Registra un nuevo proyecto para organizar la gestión de residuos de tu empresa.'}
      </p>
      
      {error && <div className="alert alert-danger">{error}</div>} {/* Display error message */}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">Nombre del Proyecto</label>
          <input
            type="text"
            className="form-control"
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={handleInputChange}
            required
            autoComplete="off"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="ubicacion" className="form-label">Ubicación</label>
          <input
            type="text"
            className="form-control"
            id="ubicacion"
            name="ubicacion"
            value={ubicacion}
            onChange={handleInputChange}
            required
            autoComplete="off"
            placeholder="Ej: Av. Providencia 123, Santiago"
          />
          <div className="form-text">
            🌍 <strong>Geocodificación automática:</strong> Las coordenadas se obtendrán automáticamente basadas en esta dirección.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
          <input
            type="date"
            className="form-control"
            id="fecha_inicio"
            name="fecha_inicio"
            value={fecha_inicio.split('T')[0]} // Format date for input
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="fecha_fin" className="form-label">Fecha de Fin</label>
          <input
            type="date"
            className="form-control"
            id="fecha_fin"
            name="fecha_fin"
            value={fecha_fin ? fecha_fin.split('T')[0] : ''} // Format date for input
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{id ? 'Actualizar Proyecto' : 'Crear Proyecto'}</button>
      </form>
    </div>
  );
};

export default ProjectForm;
