import React, { useState, useMemo, useContext } from 'react';
import { updateUserStatus } from '../api/users';
import AuthContext from '../context/AuthContext';

// A single row item for managing a user
const UserRow = ({ user, onUserUpdated }) => {
    const [selectedRole, setSelectedRole] = useState(user.rol);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { auth } = useContext(AuthContext);

    const isPending = user.estado === 'pendiente';

    const handleUpdate = async () => {
        if (user.id_usuario === auth.user.id && selectedRole !== 'admin') {
            setError('No puedes quitarte el rol de administrador a ti mismo.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await updateUserStatus(user.id_usuario, {
                rol: selectedRole,
                estado: 'aprobado' // Approving or updating always results in 'aprobado'
            });
            onUserUpdated(); // Refresh parent list
        } catch (err) {
            const message = err.response?.data?.message || 'Error al actualizar el usuario.';
            setError(message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <li className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <strong>{user.nombre}</strong>
                    <small className="d-block text-muted">{user.email}</small>
                </div>
                <div className="d-flex align-items-center">
                    <select 
                        className="form-select form-select-sm me-2" 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="admin">Admin</option>
                        <option value="gerente">Gerente</option>
                        <option value="subgerente">Subgerente</option>
                        <option value="operador">Operador</option>
                    </select>
                    <button 
                        className={`btn btn-sm ${isPending ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? '...' : (isPending ? 'Aprobar' : 'Actualizar')}
                    </button>
                </div>
            </div>
            {error && <div className="alert alert-danger alert-sm mt-2">{error}</div>}
        </li>
    );
};


const UserRoles = ({ users, onUsersUpdate }) => {
    const { auth } = useContext(AuthContext);

    const { pendingUsers, approvedUsers } = useMemo(() => {
        const pending = users.filter(u => u.estado === 'pendiente');
        // Exclude the current user from the "approved" list to prevent self-editing in this view
        const approved = users.filter(u => u.estado === 'aprobado' && u.id_usuario !== auth.user.id);
        return { pendingUsers: pending, approvedUsers: approved };
    }, [users, auth.user.id]);

    // Only admins can see this component
    if (auth.user.rol !== 'admin') {
        return null;
    }

    return (
        <div className="card mb-4">
            <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">Gestión de Roles</h3>
            </div>
            <div className="card-body">
                {/* Pending Users Section */}
                {pendingUsers.length > 0 && (
                    <>
                        <h4 className="h6 text-muted">Pendientes de Aprobación</h4>
                        <ul className="list-group mb-4">
                            {pendingUsers.map(user => (
                                <UserRow key={user.id_usuario} user={user} onUserUpdated={onUsersUpdate} />
                            ))}
                        </ul>
                    </>
                )}

                {/* Approved Users Section */}
                <h4 className="h6 text-muted">Usuarios Activos</h4>
                <ul className="list-group">
                    {approvedUsers.length > 0 ? (
                        approvedUsers.map(user => (
                            <UserRow key={user.id_usuario} user={user} onUserUpdated={onUsersUpdate} />
                        ))
                    ) : (
                        <li className="list-group-item text-muted">No hay otros usuarios activos para gestionar.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default UserRoles;
