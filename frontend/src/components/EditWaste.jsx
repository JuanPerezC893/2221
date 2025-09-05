
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import WasteForm from './WasteForm';
import { getProyectos } from '../api/proyectos';
import { getResiduo, updateResiduo } from '../api/residuos';

const EditWaste = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formValues, handleInputChange, setValues] = useForm({
    tipo: '',
    cantidad: '',
    unidad: '',
    reciclable: false,
    id_proyecto: '',
  });
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [wasteRes, proyectosRes] = await Promise.all([getResiduo(id), getProyectos()]);
        setValues(wasteRes.data);
        setProyectos(proyectosRes.data);
      } catch (err) {
        console.error(err.response.data);
      }
    };

    fetchInitialData();
  }, [id, setValues]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateResiduo(id, formValues);
      navigate('/residuos');
    } catch (err) {
      console.error(err.response.data);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card p-3">
        <h1 className="card-title mb-4">Editar Residuo</h1>
        <form onSubmit={onSubmit}>
          <WasteForm
            formData={formValues}
            handleInputChange={handleInputChange}
            proyectos={proyectos}
            // Pass empty arrays for suggestion-related props
            wasteTypes={[]}
            filteredWasteTypes={[]}
            showSuggestions={false}
            handleWasteTypeChange={() => {}}
            handleSelectWasteType={() => {}}
            suggestionsRef={null}
          />
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">Actualizar Residuo</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWaste;
