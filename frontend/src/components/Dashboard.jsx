import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle
} from 'chart.js';
import AuthContext from '../context/AuthContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Dashboard.css'; // Import new CSS file

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const Dashboard = () => {
  const { auth, dataRefreshKey } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [wasteSummaryByType, setWasteSummaryByType] = useState([]);
  const [wasteSummaryOverTime, setWasteSummaryOverTime] = useState([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState(null);
  const [latestWasteEntries, setLatestWasteEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelsVisible, setPanelsVisible] = useState(true);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (auth.user) {
        try {
          const res = await api.get('/proyectos');
          setProjects(res.data);
        } catch (err) {
          console.error('Error fetching projects:', err);
          setError('Error al cargar la lista de proyectos.');
        }
      }
    };
    fetchProjects();
  }, [auth.user]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/pelisjuan13/cmfbt9qyo000601s4cgrghz71',
        center: [-70.6693, -33.4489],
        zoom: 4
      });
    }
  });

  useEffect(() => {
    if (!map.current || projects.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const projectsToDisplay = selectedProject === 'all'
      ? projects
      : projects.filter(p => p.id_proyecto === parseInt(selectedProject));

    if (projectsToDisplay.length === 0) return;

    projectsToDisplay.forEach(project => {
      if (project.latitud && project.longitud) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div><strong>${project.nombre}</strong><br/><span class="text-muted">${project.ubicacion}</span></div>`);
        
        const marker = new mapboxgl.Marker()
          .setLngLat([project.longitud, project.latitud])
          .setPopup(popup)
          .addTo(map.current);
        
        markersRef.current.push(marker);
      }
    });

    // Center map on the selected project or fit all markers
    if (projectsToDisplay.length === 1 && projectsToDisplay[0].latitud && projectsToDisplay[0].longitud) {
      map.current.flyTo({
        center: [projectsToDisplay[0].longitud, projectsToDisplay[0].latitud],
        zoom: 12
      });
    } else {
        const bounds = new mapboxgl.LngLatBounds();
        markersRef.current.forEach(marker => {
            bounds.extend(marker.getLngLat());
        });
        if (!bounds.isEmpty()) {
            map.current.fitBounds(bounds, { padding: 150 });
        }
    }

  }, [projects, selectedProject]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!auth.user) return;
      setLoading(true);
      setError(null);
      try {
        const projectId = selectedProject === 'all' ? undefined : selectedProject;
        const params = { projectId };
        const [byTypeRes, overTimeRes, impactRes, latestRes] = await Promise.all([
          api.get('/residuos/summary-by-type', { params }),
          api.get('/residuos/summary-over-time', { params }),
          api.get('/residuos/environmental-impact', { params }),
          api.get('/residuos/latest', { params })
        ]);
        setWasteSummaryByType(byTypeRes.data);
        setWasteSummaryOverTime(overTimeRes.data);
        setEnvironmentalImpact(impactRes.data);
        setLatestWasteEntries(latestRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedProject, auth.user, dataRefreshKey]);

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
  };

  const currentProjectDetails = projects.find(p => p.id_proyecto === parseInt(selectedProject));

  const pieChartData = {
    labels: wasteSummaryByType.length > 0 ? wasteSummaryByType.map(item => item.tipo) : ['Sin Datos'],
    datasets: [{
      label: 'Distribución de Residuos',
      data: wasteSummaryByType.length > 0 ? wasteSummaryByType.map(item => parseFloat(item.total_cantidad)) : [1],
      backgroundColor: wasteSummaryByType.length > 0 ? ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'] : ['#dee2e6'],
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };

  const barChartData = {
    labels: wasteSummaryOverTime.map(item => item.month).sort(),
    datasets: [{
      label: 'Cantidad de Residuos (kg)',
      data: wasteSummaryOverTime.map(item => parseFloat(item.total_cantidad)),
      backgroundColor: 'rgba(13, 110, 253, 0.6)',
      borderColor: 'rgba(13, 110, 253, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Gestión de Residuos por Mes',
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  if (!auth.user) {
    return <div className="container mt-5">Por favor, inicia sesión para ver el dashboard.</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  const totalWaste = (wasteSummaryByType || []).reduce((sum, item) => sum + parseFloat(item.total_cantidad), 0).toFixed(2);

  return (
    <div className="dashboard-container">
      <div ref={mapContainer} className="map-background" />
      
      <div className={`side-panel left-panel ${panelsVisible ? 'visible' : ''}`}>
        <div className="card shadow-sm h-100">
          <div className="card-header">Distribución por Tipo</div>
          <div className="card-body d-flex justify-content-center align-items-center">
            {wasteSummaryByType.length > 0 ? <Pie data={pieChartData} /> : <p className="text-muted">No hay datos.</p>}
          </div>
        </div>
        <div className="card shadow-sm mt-4">
          <div className="card-header">Últimos 5 Registros</div>
          <div className="card-body">
            {latestWasteEntries.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <tbody>
                    {latestWasteEntries.map(entry => (
                      <tr key={entry.id_residuo}>
                        <td>{entry.tipo}</td>
                        <td>{entry.cantidad} {entry.unidad}</td>
                        <td><span className="badge bg-secondary">{entry.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted p-3">No hay registros.</p>
            )}
          </div>
        </div>
      </div>

      <div className={`side-panel right-panel ${panelsVisible ? 'visible' : ''}`}>
        <div className="row mb-4">
            <div className="col-md-12">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">Total de Residuos</h5>
                  <p className="card-text display-6 fw-bold">{totalWaste} kg</p>
                </div>
              </div>
            </div>
        </div>
        <div className="row mb-4">
            <div className="col-md-12">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">CO₂ Ahorrado</h5>
                  <p className="card-text display-6 fw-bold text-success">{environmentalImpact?.co2Avoided || 0} kg</p>
                </div>
              </div>
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">% Desviado</h5>
                  <p className="card-text display-6 fw-bold text-info">{environmentalImpact?.percentageDiverted || 0}%</p>
                </div>
              </div>
            </div>
        </div>
        <div className="card shadow-sm mt-4">
          <div className="card-header">Progreso Mensual</div>
          <div className="card-body" style={{ height: '250px' }}>
            {wasteSummaryOverTime.length > 0 ? <Bar data={barChartData} options={barChartOptions} /> : <p className="text-muted">No hay datos.</p>}
          </div>
        </div>
      </div>

      <div className="top-bar">
        <h1 className="h2 text-black">{selectedProject === 'all' ? 'Dashboard General' : `Proyecto: ${currentProjectDetails?.nombre}`}</h1>
        <div className="col-4">
          <select className="form-select" value={selectedProject} onChange={handleProjectChange}>
            <option value="all">Todos los Proyectos</option>
            {projects.map(p => (
              <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={() => setPanelsVisible(!panelsVisible)} className="btn btn-secondary toggle-panels-btn">
        {panelsVisible ? 'Ocultar Paneles' : 'Mostrar Paneles'}
      </button>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
