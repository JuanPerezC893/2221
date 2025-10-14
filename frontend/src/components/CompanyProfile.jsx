import React from 'react';
import AddressAutocomplete from './AddressAutocomplete';

const CompanyProfile = ({ company, isEditing, formData, handleInputChange }) => {
  return (
    <div>
      {isEditing ? (
        <>
          <div className="mb-3">
            <label className="form-label">Nombre de empresa</label>
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
            <AddressAutocomplete 
              value={formData.direccion}
              onValueChange={(value) => handleInputChange({ target: { name: 'direccion', value: value } })}
              onAddressSelect={(selected) => handleInputChange({ target: { name: 'direccion', value: selected } })}
              name="direccion"
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
          <p><strong>Nombre de empresa:</strong> {company.razon_social}</p>
          <p><strong>RUT:</strong> {company.rut}</p>
          <p><strong>Dirección:</strong> {company.direccion}</p>
        </>
      )}
    </div>
  );
};

export default CompanyProfile;