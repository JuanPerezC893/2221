import React, { createContext, useState } from 'react';

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [zoomToLocation, setZoomToLocation] = useState(null);

  return (
    <MapContext.Provider value={{ zoomToLocation, setZoomToLocation }}>
      {children}
    </MapContext.Provider>
  );
};

export default MapContext;
