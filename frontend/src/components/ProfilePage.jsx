import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Profile from './Profile'; // El perfil original para constructoras
import GestorProfile from './GestorProfile'; // El nuevo perfil para gestores

const ProfilePage = () => {
  const { auth } = useContext(AuthContext);

  if (!auth.isAuthenticated) {
    // Muestra un loader o nada mientras se verifica la autenticación
    return null;
  }

  // Renderiza el componente de perfil correcto según el tipo de empresa del usuario
  if (auth.user?.tipo_empresa === 'gestora') {
    return <GestorProfile />;
  }

  // Por defecto, o para constructoras, muestra el perfil original
  return <Profile />;
};

export default ProfilePage;
