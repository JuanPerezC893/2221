import React from 'react';

const UserRoles = ({ users }) => {
  // Define the desired order of roles
  const roleOrder = ['Gerente', 'Subgerente', 'Operador'];

  // Sort users based on the defined role order
  const sortedUsers = [...users].sort((a, b) => {
    const roleA = roleOrder.indexOf(a.rol);
    const roleB = roleOrder.indexOf(b.rol);
    // If a role is not in the order, place it at the end
    if (roleA === -1) return 1;
    if (roleB === -1) return -1;
    return roleA - roleB;
  });

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h3 className="h5 mb-0">Usuarios de la Empresa</h3>
        <button className="btn btn-outline-light btn-sm" disabled title="Próximamente">+ Añadir Usuario</button>
      </div>
      <div className="card-body">
        <ul className="list-group">
          {sortedUsers.length > 0 ? (
            sortedUsers.map(user => (
              <li key={user.id_usuario} className="list-group-item">
                <div>
                  <strong>{user.nombre}</strong>
                  <small className="d-block text-muted">{user.email}</small>
                </div>
                <span className="badge bg-secondary">{user.rol}</span>
              </li>
            ))
          ) : (
            <li className="list-group-item">No hay otros usuarios para mostrar.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserRoles;
