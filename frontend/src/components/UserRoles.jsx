import React, { useState, useMemo, useContext, useEffect } from 'react';
import { updateUserStatus } from '../api/users';
import AuthContext from '../context/AuthContext';

// A single row item for managing a user
const UserRow = ({ user, role, onRoleChange, isEditing }) => {
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
                        value={role} 
                        onChange={(e) => onRoleChange(user.id_usuario, e.target.value)}
                        disabled={!isEditing}
                        style={{ width: '150px' }}
                    >
                        <option value="admin">Admin</option>
                        <option value="gerente">Gerente</option>
                        <option value="subgerente">Subgerente</option>
                        <option value="operador">Operador</option>
                    </select>
                </div>
            </div>
        </li>
    );
};

const UserRoles = ({ users, onUsersUpdate }) => {
    const { auth } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [userRoles, setUserRoles] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const roles = users.reduce((acc, user) => {
            acc[user.id_usuario] = user.rol;
            return acc;
        }, {});
        setUserRoles(roles);
    }, [users]);

    const { pendingUsers, approvedUsers } = useMemo(() => {
        const pending = users.filter(u => u.estado === 'pendiente' && u.id_usuario !== auth.user.id);
        const approved = users.filter(u => u.estado === 'aprobado' && u.id_usuario !== auth.user.id);
        return { pendingUsers: pending, approvedUsers: approved };
    }, [users, auth.user.id]);

    const handleRoleChange = (userId, newRole) => {
        setUserRoles(prevRoles => ({
            ...prevRoles,
            [userId]: newRole,
        }));
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError('');
        
        const updates = Object.keys(userRoles).map(userId => {
            const originalUser = users.find(u => u.id_usuario === parseInt(userId));
            if (originalUser && originalUser.rol !== userRoles[userId]) {
                return updateUserStatus(userId, { rol: userRoles[userId], estado: 'aprobado' });
            }
            // Also consider pending users who might not have a role change but need approval
            if (originalUser && originalUser.estado === 'pendiente') {
                 return updateUserStatus(userId, { rol: userRoles[userId], estado: 'aprobado' });
            }
            return null;
        }).filter(Boolean);

        if (updates.length === 0) {
            setIsEditing(false);
            setLoading(false);
            return;
        }

        try {
            await Promise.all(updates);
            onUsersUpdate(); // Refresh parent list
            setIsEditing(false);
        } catch (err) {
            const message = err.response?.data?.message || 'Error al actualizar los roles.';
            setError(message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const originalRoles = users.reduce((acc, user) => {
            acc[user.id_usuario] = user.rol;
            return acc;
        }, {});
        setUserRoles(originalRoles);
        setIsEditing(false);
        setError('');
    };

    if (auth.user.rol !== 'admin') {
        return null;
    }

    return (
        <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3 className="h5 mb-0">Gestión de Roles</h3>
                {!isEditing ? (
                    <button className="btn btn-light btn-sm" onClick={() => setIsEditing(true)}>
                        Editar
                    </button>
                ) : (
                    <div>
                        <button className="btn btn-success btn-sm me-2" onClick={handleSaveChanges} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                
                {pendingUsers.length > 0 && (
                    <>
                        <h4 className="h6 text-muted">Pendientes de Aprobación</h4>
                        <ul className="list-group mb-4">
                            {pendingUsers.map(user => (
                                <UserRow 
                                    key={user.id_usuario} 
                                    user={user}
                                    role={userRoles[user.id_usuario] || user.rol}
                                    onRoleChange={handleRoleChange}
                                    isEditing={isEditing}
                                />
                            ))}
                        </ul>
                    </>
                )}

                <h4 className="h6 text-muted">Usuarios Activos</h4>
                <ul className="list-group">
                    {approvedUsers.length > 0 ? (
                        approvedUsers.map(user => (
                            <UserRow 
                                key={user.id_usuario} 
                                user={user}
                                role={userRoles[user.id_usuario] || user.rol}
                                onRoleChange={handleRoleChange}
                                isEditing={isEditing}
                            />
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
