import React, { useState, useEffect } from 'react';
import { getTiposResiduoOptions, getCiudadesOptions, getEmpresasOptions } from '../api/filtros';
import './FiltroResiduos.css';

const FiltroResiduos = ({ onFilterChange, isLoading }) => {
  const initialFilters = { tipo: '', ciudad: '', empresa: '' };
  const [tipos, setTipos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [tiposRes, ciudadesRes, empresasRes] = await Promise.all([
          getTiposResiduoOptions(),
          getCiudadesOptions(),
          getEmpresasOptions(),
        ]);
        setTipos(tiposRes.data);
        setCiudades(ciudadesRes.data);
        setEmpresas(empresasRes.data);
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  return (
    <div className="card mb-4 filtro-card">
      <div className="card-header text-center">
        <h5 className="mb-0 text-dark fw-bold">
          <i className="bi bi-funnel-fill me-2"></i>
          Filtrar Residuos Disponibles
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleApplyFilters}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md">
              <label htmlFor="tipo" className="form-label">Tipo de Residuo</label>
              <select id="tipo" name="tipo" className="form-select" value={filters.tipo} onChange={handleInputChange} disabled={isLoading}>
                <option value="">Todos</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)} 
              </select>
            </div>
            <div className="col-12 col-md">
              <label htmlFor="ciudad" className="form-label">Ciudad</label>
              <select id="ciudad" name="ciudad" className="form-select" value={filters.ciudad} onChange={handleInputChange} disabled={isLoading}>
                <option value="">Todas</option>
                {ciudades.map(c => <option key={c} value={c}>{c}</option>)} 
              </select>
            </div>
            <div className="col-12 col-md">
              <label htmlFor="empresa" className="form-label">Empresa Constructora</label>
              <select id="empresa" name="empresa" className="form-select" value={filters.empresa} onChange={handleInputChange} disabled={isLoading}>
                <option value="">Todas</option>
                {empresas.map(e => <option key={e} value={e}>{e}</option>)} 
              </select>
            </div>
            <div className="col-12 col-md-auto">
              <button type="submit" className="btn btn-aplicar w-100" disabled={isLoading}>
                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Aplicar'}
              </button>
            </div>
            <div className="col-12 col-md-auto">
              <button type="button" className="btn btn-limpiar w-100" onClick={handleResetFilters} disabled={isLoading}>
                Limpiar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiltroResiduos;