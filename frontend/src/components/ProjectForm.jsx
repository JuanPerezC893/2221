import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { getProyecto, createProyecto, updateProyecto } from '../api/proyectos';
import AddressAutocomplete from './AddressAutocomplete';

const ProjectForm = ({ projectId: projectIdProp, onSuccess, onClose }) => {
  const { id: idFromParams } = useParams();
  const navigate = useNavigate();
  const { triggerDataRefresh } = useContext(AuthContext);

  const id = projectIdProp !== undefined ? projectIdProp : idFromParams;
  const isModalMode = typeof onClose === 'function';

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
    setValues({
      ...formValues,
      ubicacion: addressObject.display_name,
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
      
      if (isModalMode) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (err) {
      console.error('Error guardando el proyecto:', err.response?.data || err.message);
      setError('Error guardando el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  // Standalone page success message
  if (!isModalMode && successMessage) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success" role="alert">{successMessage}</div>
        <p>Serás redirigido en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className={isModalMode ? '' : 'container mt-4'}>
      <h1 className="display-5 fw-bold mb-2 text-center text-dark">{id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h1>
      <p className="lead text-muted text-center mb-4">
        {id ? 'Modifica los detalles de tu proyecto.' : 'Registra un nuevo proyecto para tu empresa.'}
      </p>
      
      <div className={isModalMode ? '' : 'card'}>
        <div className={`card-header bg-primary text-white ${isModalMode ? 'd-none' : ''}`}>
          {id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
        </div>
        <div className={isModalMode ? '' : 'card-body'}>
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
                fetchFullDetails={true}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
                <input type="date" className="form-control" id="fecha_inicio" name="fecha_inicio" value={fecha_inicio} onChange={handleInputChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="fecha_fin" className="form-label">Fecha de Fin</label>
                <input type="date" className="form-control" id="fecha_fin" name="fecha_fin" value={fecha_fin} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              {isModalMode && (
                <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (id ? 'Actualizando...' : 'Creando...') : (id ? 'Actualizar Proyecto' : 'Crear Proyecto')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;