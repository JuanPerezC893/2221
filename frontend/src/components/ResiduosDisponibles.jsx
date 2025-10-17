import React, { useState, useEffect } from 'react';
import { getResiduosDisponibles } from '../api/residuos';
import FiltroResiduos from './FiltroResiduos';
import ResiduoAccordion from './ResiduoAccordion'; // Importar el nuevo componente

const ResiduosDisponibles = () => {
  const [residuos, setResiduos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tipo: '', ciudad: '', empresa: '' });

  useEffect(() => {
    const fetchResiduos = async () => {
      setLoading(true);
      try {
        const { data } = await getResiduosDisponibles(filters);
        setResiduos(data);
      } catch (err) {
        setError('No se pudieron cargar los residuos disponibles.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResiduos();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <FiltroResiduos onFilterChange={handleFilterChange} isLoading={loading} />
      {loading && <p className="text-center">Cargando residuos disponibles...</p>}
      {error && <p className="text-center text-danger">{error}</p>}
      {!loading && !error && (
        <ResiduoAccordion residuos={residuos} />
      )}
    </>
  );
};

export default ResiduosDisponibles;
