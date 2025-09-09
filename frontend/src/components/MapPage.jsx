import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MapPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Dashboard, which now contains the map
    navigate('/dashboard');
  }, [navigate]);

  // Render nothing, or a loading indicator while redirecting
  return null;
};

export default MapPage;