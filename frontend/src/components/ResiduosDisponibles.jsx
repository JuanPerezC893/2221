import React, { useState, useEffect } from 'react';
import { getResiduosDisponibles } from '../api/residuos';
import FiltroResiduos from './FiltroResiduos';
import ResiduoAccordion from './ResiduoAccordion'; // Importar el nuevo componente
import Pagination from './Pagination'; // Importar el componente de paginación

const ResiduosDisponibles = () => {
  const [residuos, setResiduos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tipo: '', ciudad: '', empresa: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchResiduos = async () => {
      setLoading(true);
      try {
        const { data } = await getResiduosDisponibles({ ...filters, page: currentPage });
        setResiduos(data.residuos);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError('No se pudieron cargar los residuos disponibles.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResiduos();
  }, [filters, currentPage]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="my-3">
        <FiltroResiduos onFilterChange={handleFilterChange} isLoading={loading} />
      </div>
      {loading && <p className="text-center">Cargando residuos disponibles...</p>}
      {error && <p className="text-center text-danger">{error}</p>}
      {!loading && !error && (
        <>
          <ResiduoAccordion residuos={residuos} />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </>
  );
};

export default ResiduosDisponibles;
