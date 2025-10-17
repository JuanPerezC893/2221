import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Layout from './Layout';
import GestorLayout from './GestorLayout';

const ProfileLayout = ({ children }) => {
  const { auth } = useContext(AuthContext);

  if (!auth.isAuthenticated) {
    // O manejar un estado de carga/error
    return null;
  }

  if (auth.user?.tipo_empresa === 'gestora') {
    return <GestorLayout>{children}</GestorLayout>;
  }

  // Por defecto, o si es constructora
  return <Layout>{children}</Layout>;
};

export default ProfileLayout;
