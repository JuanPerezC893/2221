
import React, { useEffect, useState } from 'react';
import { useForm } from '../hooks/useForm';
import WasteForm from './WasteForm';
import { updateResiduo } from '../api/residuos';

const EditWaste = ({ wasteToEdit, proyectos, onDataChange, onClose }) => {
  const [formValues, handleInputChange, setValues] = useForm({
    tipo: '',
    cantidad: '',
    unidad: '',
    reciclable: false,
    id_proyecto: '',
  });

  useEffect(() => {
    if (wasteToEdit) {
      setValues({
        tipo: wasteToEdit.tipo || '',
        cantidad: wasteToEdit.cantidad || '',
        unidad: wasteToEdit.unidad || '',
        reciclable: wasteToEdit.reciclable || false,
        id_proyecto: wasteToEdit.id_proyecto || '',
      });
    }
  }, [wasteToEdit, setValues]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateResiduo(wasteToEdit.id_residuo, formValues);
      if (onDataChange) {
        onDataChange();
      }
      onClose(); // Close modal on success
    } catch (err) {
      console.error(err.response?.data || err);
      // Optionally, display an error message to the user within the modal
    }
  };

  if (!wasteToEdit) return null;

  return (
    <div className="container mt-4">
      <div className="card p-3">
        <h1 className="card-title mb-4">Editar Residuo</h1>
        <form onSubmit={onSubmit}>
          <WasteForm
            formData={formValues}
            handleInputChange={handleInputChange}
            proyectos={proyectos}
            // Pass empty arrays for suggestion-related props as they are not needed here
            wasteTypes={[]}
            filteredWasteTypes={[]}
            showSuggestions={false}
            handleWasteTypeChange={() => {}}
            handleSelectWasteType={() => {}}
            suggestionsRef={null}
          />
          <div className="d-flex justify-content-end mt-4">
            <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Actualizar Residuo</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWaste;
