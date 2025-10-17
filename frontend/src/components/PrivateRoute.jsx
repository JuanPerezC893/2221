
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ children, perfilRequerido, ...rest }) => {
  const { auth } = useContext(AuthContext);

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si se requiere un perfil específico, verificarlo
  if (perfilRequerido && auth.user?.tipo_empresa !== perfilRequerido) {
    // Opcional: Redirigir a una página de "No Autorizado" en lugar del login
    // Por ahora, lo enviamos al login
    return <Navigate to="/login" />;
  }

  // Si todo está bien, renderizar el componente hijo
  return React.cloneElement(children, rest);
};

export default PrivateRoute;
