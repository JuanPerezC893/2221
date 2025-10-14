import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { getChartColors } from '../utils/colorUtils';


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
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);

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

      map.current.on('load', () => {
        map.current.addSource('proyectos', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50   // Radius of each cluster when clustering points (defaults to 50)
        });

        // Layer for clusters
        // Define cluster layers with zoom-dependent radius
        const clusterLayers = [
          {
            id: 'clusters-large',
            filter: ['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 100]],
            paint: {
              'circle-color': '#f28cb1',
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 16, 8, 28]
            }
          },
          {
            id: 'clusters-medium',
            filter: ['all', ['has', 'point_count'], ['<', ['get', 'point_count'], 100], ['>=', ['get', 'point_count'], 20]],
            paint: {
              'circle-color': '#f1f075',
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 20]
            }
          },
          {
            id: 'clusters-small',
            filter: ['all', ['has', 'point_count'], ['<', ['get', 'point_count'], 20]],
            paint: {
              'circle-color': '#51bbd6',
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 8, 8, 14]
            }
          }
        ];

        clusterLayers.forEach(layer => {
          map.current.addLayer({
            id: layer.id,
            type: 'circle',
            source: 'proyectos',
            filter: layer.filter,
            paint: layer.paint
          });
        });

        // Layer for cluster count
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'proyectos',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // Layer for unclustered points
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'proyectos',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#0d6efd',
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 10, 8, 15, 12],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        });

        const clusterLayerIds = clusterLayers.map(l => l.id);

        // Click event for clusters to zoom in
        map.current.on('click', clusterLayerIds, (e) => {
          const features = map.current.queryRenderedFeatures(e.point, { layers: clusterLayerIds });
          const clusterId = features[0].properties.cluster_id;
          map.current.getSource('proyectos').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          });
        });

        // Click event for unclustered points for popup
        map.current.on('click', 'unclustered-point', (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { nombre, ubicacion } = e.features[0].properties;
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<div><strong>${nombre}</strong><br/><span class="text-muted">${ubicacion}</span></div>`)
            .addTo(map.current);
        });

        const allClusterLayers = [...clusterLayerIds, 'unclustered-point'];
        allClusterLayers.forEach(layerId => {
            map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; });
            map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; });
        });

        setIsMapLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !map.current) return;

    const source = map.current.getSource('proyectos');
    if (!source) return;

    const features = projects
      .filter(p => p.latitud && p.longitud)
      .map(project => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [project.longitud, project.latitud]
        },
        properties: {
          id_proyecto: project.id_proyecto,
          nombre: project.nombre,
          ubicacion: project.ubicacion
        }
      }));

    source.setData({ type: 'FeatureCollection', features: features });

    const clusterLayerIds = ['clusters-large', 'clusters-medium', 'clusters-small'];

    if (selectedProject === 'all') {
      map.current.setFilter('unclustered-point', ['!', ['has', 'point_count']]);
      map.current.setFilter('cluster-count', ['has', 'point_count']);
      map.current.setFilter('clusters-large', ['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 100]]);
      map.current.setFilter('clusters-medium', ['all', ['has', 'point_count'], ['<', ['get', 'point_count'], 100], ['>=', ['get', 'point_count'], 20]]);
      map.current.setFilter('clusters-small', ['all', ['has', 'point_count'], ['<', ['get', 'point_count'], 20]]);

      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates);
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 150, maxZoom: 10 });
      }
    } else {
      const projectId = parseInt(selectedProject);
      // Hide clusters and only show the selected project
      map.current.setFilter('unclustered-point', ['==', 'id_proyecto', projectId]);
      clusterLayerIds.forEach(id => map.current.setFilter(id, ['==', 'id_proyecto', -1]));
      map.current.setFilter('cluster-count', ['==', 'id_proyecto', -1]);

      const selectedFeature = features.find(f => f.properties.id_proyecto === projectId);
      if (selectedFeature) {
        map.current.flyTo({
          center: selectedFeature.geometry.coordinates,
          zoom: 12
        });
      }
    }
  }, [isMapLoaded, projects, selectedProject]);

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
    labels: wasteSummaryByType.map(item => item.tipo),
    datasets: [{
      label: 'Distribución de Residuos',
      data: wasteSummaryByType.map(item => parseFloat(item.total_cantidad)),
      backgroundColor: getChartColors(wasteSummaryByType.map(item => item.tipo)),
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

  const getStatusBadge = (status) => {
    const statusStyles = {
      'pendiente': 'bg-secondary',
      'en camino': 'bg-primary',
      'entregado': 'bg-success',
    };
    return <span className={`badge ${statusStyles[status] || 'bg-dark'}`}>{status}</span>;
  };

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
          <div className="card-header d-flex justify-content-between align-items-center">
            Últimos 5 Registros
            <Link to="/residuos" className="btn btn-outline-primary btn-sm">Gestionar Todos</Link>
          </div>
          <div className="card-body">
            {latestWasteEntries.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <tbody>
                    {latestWasteEntries.map(entry => (
                      <tr key={entry.id_residuo}>
                        <td>{entry.tipo}</td>
                        <td>{entry.cantidad} {entry.unidad}</td>
                        <td>{getStatusBadge(entry.estado)}</td>
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
