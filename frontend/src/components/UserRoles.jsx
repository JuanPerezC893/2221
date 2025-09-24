import React, { useState } from 'react';
import api from '../services/api';
import { useForm } from '../hooks/useForm';
import { validarRut } from '../utils/validation';

const AddUserForm = ({ onCancel, onUserAdded }) => {
    const [formValues, handleInputChange, resetForm] = useForm({
        nombre: '',
        email: '',
        password: '',
        rol: 'subgerente', // Default role
        rut_personal: ''
    });
    const [error, setError] = useState('');
    const [rutError, setRutError] = useState('');

    const handleRutChange = (e) => {
        const { value } = e.target;
        handleInputChange(e); // Update form state
        if (value && !validarRut(value)) {
            setRutError('RUT no válido');
        } else {
            setRutError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rutError) {
            setError('Por favor, ingrese un RUT válido.');
            return;
        }
        setError('');
        try {
            await api.post('/users/create-by-admin', formValues);
            onUserAdded(); // Notify parent to refresh
            resetForm();
        } catch (err) {
            const message = err.response?.data?.message || 'Error al crear el usuario.';
            setError(message);
            console.error(err);
        }
    };

    return (
        <div className="card mt-3">
            <div className="card-body">
                <h4 className="card-title">Añadir Nuevo Usuario</h4>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input type="text" name="nombre" value={formValues.nombre} onChange={handleInputChange} className="form-control" placeholder="Nombre Completo" required />
                    </div>
                    <div className="mb-3">
                        <input type="email" name="email" value={formValues.email} onChange={handleInputChange} className="form-control" placeholder="Email" required />
                    </div>
                    <div className="mb-3">
                        <input type="text" name="rut_personal" value={formValues.rut_personal} onChange={handleRutChange} className={`form-control ${rutError ? 'is-invalid' : ''}`} placeholder="RUT Personal" required />
                        {rutError && <div className="invalid-feedback">{rutError}</div>}
                    </div>
                    <div className="mb-3">
                        <input type="password" name="password" value={formValues.password} onChange={handleInputChange} className="form-control" placeholder="Contraseña (min. 8 caracteres)" required />
                    </div>
                    <div className="mb-3">
                        <select name="rol" value={formValues.rol} onChange={handleInputChange} className="form-select">
                            <option value="subgerente">Subgerente</option>
                            <option value="gerente">Gerente</option>
                            <option value="operador">Operador</option>
                        </select>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={!!rutError}>Crear Usuario</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserRoles = ({ users, onUsersUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);

    const handleUserAdded = () => {
        setIsAdding(false);
        onUsersUpdate(); // Call the refresh function from the parent
    };

    const roleOrder = ['admin', 'gerente', 'subgerente', 'operador'];
    const sortedUsers = [...users].sort((a, b) => {
        const roleA = roleOrder.indexOf(a.rol);
        const roleB = roleOrder.indexOf(b.rol);
        return (roleA === -1 ? 99 : roleA) - (roleB === -1 ? 99 : roleB);
    });

    return (
        <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3 className="h5 mb-0">Usuarios de la Empresa</h3>
                {!isAdding && (
                    <button 
                        className="btn btn-outline-light btn-sm"
                        onClick={() => setIsAdding(true)}
                        disabled={users.length >= 3}
                        title={users.length >= 3 ? "Máximo de 3 usuarios alcanzado" : "Añadir Nuevo Usuario"}
                    >
                        + Añadir Usuario
                    </button>
                )}
            </div>
            <div className="card-body">
                {isAdding && <AddUserForm onCancel={() => setIsAdding(false)} onUserAdded={handleUserAdded} />}
                <ul className="list-group mt-3">
                    {sortedUsers.length > 0 ? (
                        sortedUsers.map(user => (
                            <li key={user.id_usuario} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{user.nombre}</strong>
                                    <small className="d-block text-muted">{user.rut_personal || user.email}</small>
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