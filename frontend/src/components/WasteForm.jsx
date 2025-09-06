import React from 'react';

const WasteForm = ({ formData, handleInputChange, handleWasteTypeChange, showSuggestions, filteredWasteTypes, handleSelectWasteType, suggestionsRef, proyectos, setShowSuggestions }) => {
  return (
    <>
      {/* Project Selection */}
      <div className="mb-3">
        <label htmlFor="id_proyecto" className="form-label">Proyecto</label>
        <select
          className="form-select"
          id="id_proyecto"
          name="id_proyecto"
          value={formData.id_proyecto}
          onChange={handleInputChange}
          required
        >
          {proyectos.length > 0 ? (
            proyectos.map(proj => (
              <option key={proj.id_proyecto} value={proj.id_proyecto}>
                {proj.nombre}
              </option>
            ))
          ) : (
            <option value="">No hay proyectos disponibles</option>
          )}
        </select>
      </div>

      {/* Tipo de Residuo */}
      <div className="mb-3" ref={suggestionsRef}>
        <label htmlFor="tipo" className="form-label">Tipo de Residuo</label>
        <input
          type="text"
          className="form-control"
          id="tipo"
          name="tipo"
          placeholder="Ej: Madera, Metal, Plástico..."
          value={formData.tipo}
          onChange={handleWasteTypeChange}
          onFocus={() => setShowSuggestions(true)}
          required
        />
        {showSuggestions && filteredWasteTypes.length > 0 && (
          <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
            {filteredWasteTypes.map((type, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                onClick={() => handleSelectWasteType(type)}
                style={{ cursor: 'pointer' }}
              >
                {type}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cantidad y Unidad */}
      <div className="row mb-3">
        <div className="col-md-8">
          <label htmlFor="cantidad" className="form-label">Cantidad/Peso</label>
          <input
            type="number"
            className="form-control"
            id="cantidad"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleInputChange}
            required
            min="0"
            step="any"
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="unidad" className="form-label">Unidad</label>
          <select
            className="form-select"
            id="unidad"
            name="unidad"
            value={formData.unidad}
            onChange={handleInputChange}
            required
          >
            <option value="kg">kg (kilogramos)</option>
            <option value="toneladas">toneladas</option>
            <option value="g">g (gramos)</option>
            <option value="ton">ton (toneladas)</option>
            <option value="t">t (toneladas)</option>
            <option value="lb">lb (libras)</option>
          </select>
          <div className="form-text">
            💡 <strong>Tip:</strong> Si ingresas toneladas, se convertirá automáticamente a kg para mantener consistencia en los cálculos.
          </div>
        </div>
      </div>

      {/* Reciclable */}
      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="reciclable"
          name="reciclable"
          checked={formData.reciclable}
          onChange={handleInputChange}
        />
        <label className="form-check-label" htmlFor="reciclable">¿Es reciclable/reutilizable?</label>
      </div>
    </>
  );
};

export default WasteForm;
