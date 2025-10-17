import React, { createContext, useState, useMemo } from 'react';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState('constructora'); // 'constructora' or 'gestora'

  // Usamos useMemo para evitar re-renders innecesarios en los componentes que consuman el contexto.
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
};

export default ModeContext;
