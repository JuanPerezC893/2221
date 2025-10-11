import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { getProyecto, createProyecto, updateProyecto } from '../api/proyectos';
import AddressAutocomplete from './AddressAutocomplete';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerDataRefresh } = useContext(AuthContext);
  const [formValues, handleInputChange, setValues] = useForm({
    nombre: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        setLoading(true);
        try {
          const res = await getProyecto(id);
          const projectData = {
            ...res.data,
            fecha_inicio: res.data.fecha_inicio ? res.data.fecha_inicio.split('T')[0] : '',
            fecha_fin: res.data.fecha_fin ? res.data.fecha_fin.split('T')[0] : '',
          };
          setValues(projectData);
        } catch (err) {
          console.error(err.response?.data);
          setError('Error al cargar el proyecto.');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, setValues]);

  const { nombre, ubicacion, fecha_inicio, fecha_fin } = formValues;

  const handleAddressSelect = (addressObject) => {
    // The component now returns the full address object because fetchFullDetails is true
    setValues({
      ...formValues,
      ubicacion: addressObject.display_name,
      // Here you could also set lat/lon if your form state handles it
      // latitud: addressObject.lat,
      // longitud: addressObject.lon,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (id) {
        await updateProyecto(id, formValues);
        setSuccessMessage('¡Proyecto actualizado exitosamente!');
      } else {
        await createProyecto(formValues);
        setSuccessMessage('¡Proyecto creado exitosamente!');
      }
      triggerDataRefresh();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error guardando el proyecto:', err.response?.data || err.message);
      setError('Error guardando el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success" role="alert">{successMessage}</div>
        <p>Serás redirigido en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="display-5 fw-bold mb-2 text-center text-dark">{id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h1>
      <p className="lead text-muted text-center mb-4">
        {id ? 'Modifica los detalles de tu proyecto.' : 'Registra un nuevo proyecto para tu empresa.'}
      </p>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          {id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre del Proyecto</label>
              <input type="text" className="form-control" id="nombre" name="nombre" value={nombre} onChange={handleInputChange} required autoComplete="off" />
            </div>
            
            <div className="mb-3">
              <label htmlFor="ubicacion" className="form-label">Ubicación</label>
              <AddressAutocomplete 
                value={ubicacion}
                onValueChange={(value) => handleInputChange({ target: { name: 'ubicacion', value } })}
                onAddressSelect={handleAddressSelect}
                name="ubicacion"
                required={true}
                fetchFullDetails={true} // Important: This tells the component to fetch coordinates
              />
            </div>

            <div className="mb-3">
              <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
              <input type="date" className="form-control" id="fecha_inicio" name="fecha_inicio" value={fecha_inicio} onChange={handleInputChange} required />
            </div>
            
            <div className="mb-3">
              <label htmlFor="fecha_fin" className="form-label">Fecha de Fin</label>
              <input type="date" className="form-control" id="fecha_fin" name="fecha_fin" value={fecha_fin} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (id ? 'Actualizando...' : 'Creando...') : (id ? 'Actualizar Proyecto' : 'Crear Proyecto')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;