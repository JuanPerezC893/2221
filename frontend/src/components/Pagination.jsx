import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination-container">
      <button className="pagination-button" onClick={handlePrevious} disabled={currentPage === 1}>
        <i className="bi bi-chevron-left"></i>
        Anterior
      </button>
      <span className="pagination-info">{currentPage} de {totalPages}</span>
      <button className="pagination-button" onClick={handleNext} disabled={currentPage === totalPages}>
        Siguiente
        <i className="bi bi-chevron-right"></i>
      </button>
    </nav>
  );
};

export default Pagination;