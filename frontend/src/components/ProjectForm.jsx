import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import AuthContext from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { getProyecto, createProyecto, updateProyecto } from '../api/proyectos';
import { getSuggestions, retrieveSuggestion } from '../api/geocoding';
import { debounce } from '../utils/debounce'; // Assuming a debounce utility exists

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

  // State for address suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const sessionToken = useRef(uuidv4());

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        setLoading(true);
        try {
          const res = await getProyecto(id);
          // Ensure dates are formatted correctly for the input fields
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

  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(debounce(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSuggesting(true);
    try {
      const data = await getSuggestions(query, sessionToken.current);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsSuggesting(false);
    }
  }, 300), []);

  const handleUbicacionChange = (e) => {
    handleInputChange(e); // Update form state immediately
    fetchSuggestions(e.target.value); // Fetch suggestions with debounce
  };

  const handleSuggestionClick = async (suggestion) => {
    setIsSuggesting(true);
    try {
      const fullAddress = await retrieveSuggestion(suggestion.mapbox_id, sessionToken.current);
      setValues({
        ...formValues,
        ubicacion: fullAddress.display_name,
      });
      setSuggestions([]); // Clear suggestions after selection
    } catch (error) {
      console.error('Error retrieving suggestion:', error);
    } finally {
      setIsSuggesting(false);
    }
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
      <h1 className="display-5 fw-bold mb-2">{id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h1>
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
            
            <div className="mb-3 position-relative">
              <label htmlFor="ubicacion" className="form-label">Ubicación</label>
              <input
                type="text"
                className="form-control"
                id="ubicacion"
                name="ubicacion"
                value={ubicacion}
                onChange={handleUbicacionChange}
                required
                autoComplete="off"
                placeholder="Ej: Av. Providencia 123, Santiago"
              />
              {suggestions.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {suggestions.map((s) => (
                    <li key={s.mapbox_id} className="list-group-item list-group-item-action" onClick={() => handleSuggestionClick(s)}>
                      <strong>{s.name}</strong>
                      <div className="text-muted small">{s.full_address || s.place_formatted || s.address}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
              <input type="date" className="form-control" id="fecha_inicio" name="fecha_inicio" value={fecha_inicio} onChange={handleInputChange} required />
            </div>
            
            <div className="mb-3">
              <label htmlFor="fecha_fin" className="form-label">Fecha de Fin</label>
              <input type="date" className="form-control" id="fecha_fin" name="fecha_fin" value={fecha_fin} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading || isSuggesting}>
              {loading ? (id ? 'Actualizando...' : 'Creando...') : (id ? 'Actualizar Proyecto' : 'Crear Proyecto')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
