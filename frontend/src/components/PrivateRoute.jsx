
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ children, ...rest }) => {
  const { auth } = useContext(AuthContext);

  // Clone the children and pass the rest of the props to them
  return auth.isAuthenticated ? React.cloneElement(children, rest) : <Navigate to="/login" />;
};

export default PrivateRoute;
