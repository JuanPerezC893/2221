import React from 'react';

const CompanyProfile = ({ company, isEditing, formData, handleInputChange }) => {
  return (
    <div>
      {isEditing ? (
        <>
          <div className="mb-3">
            <label className="form-label">Razón Social</label>
            <input
              type="text"
              className="form-control"
              name="razon_social"
              value={formData.razon_social}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-control"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">RUT</label>
            <input
              type="text"
              className="form-control"
              name="rut"
              value={company.rut}
              disabled
            />
          </div>
        </>
      ) : (
        <>
          <p><strong>Razón Social:</strong> {company.razon_social}</p>
          <p><strong>RUT:</strong> {company.rut}</p>
          <p><strong>Dirección:</strong> {company.direccion}</p>
        </>
      )}
    </div>
  );
};

export default CompanyProfile;
