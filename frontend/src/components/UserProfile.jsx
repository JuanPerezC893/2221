import React from 'react';

const UserProfile = ({ user, isEditing, formData, handleInputChange, projects, wastes, onOpenChangePassword }) => {
  return (
    <div>
              {isEditing ? (
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                  <button className="btn btn-secondary w-100 mt-3" onClick={onOpenChangePassword}>
                    Cambiar Contraseña
                  </button>
                </div>
              ) : (
                <p><strong>Nombre:</strong> {user.nombre}</p>
              )}
              <hr />
              <div className="row text-center mb-3">
                <div className="col">
                  <h5 className="card-title profile-stat-number">{projects.length}</h5>
                  <p className="card-text text-muted profile-stat-label">Proyectos</p>
                </div>
                <div className="col">
                  <h5 className="card-title profile-stat-number">{wastes.length}</h5>
                  <p className="card-text text-muted profile-stat-label">Residuos</p>
                </div>
              </div>    </div>
  );
};

export default UserProfile;
