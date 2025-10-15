import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { getProyectos } from '../api/proyectos';
import { getSummaryByType, getSummaryOverTime, getEnvironmentalImpact, getLatest } from '../api/residuos';

import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import AuthContext from '../context/AuthContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Dashboard.css'; // Import new CSS file
import { getChartColors } from '../utils/colorUtils';
import AddProjectModal from './AddProjectModal';
import AddWasteModal from './AddWasteModal';
import { getDirections } from '../api/mapbox';
const BODEGA_COORDS = [-70.773829, -33.40862];


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const Dashboard = ({ isAddProjectModalOpen, closeAddProjectModal, isAddWasteModalOpen, closeAddWasteModal }) => {
  const { auth, dataRefreshKey } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [projectToSelect, setProjectToSelect] = useState(null);
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
  const selectedProjectMarker = useRef(null);
  const animationFrameId = useRef(null);

  const fetchProjects = useCallback(async () => {
    if (auth.user) {
      try {
        const res = await getProyectos();
        setProjects(res.data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error al cargar la lista de proyectos.');
      }
    }
  }, [auth.user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (isAddProjectModalOpen || isAddWasteModalOpen) {
      setPanelsVisible(false);
      if (map.current) {
        map.current.zoomTo(2, { duration: 1000 });
      }
    } else {
      setPanelsVisible(true);
    }
  }, [isAddProjectModalOpen, isAddWasteModalOpen]);

  const handleProjectCreated = (newProjectId) => {
    fetchProjects();
    setProjectToSelect(newProjectId);
  };

  useEffect(() => {
    if (projectToSelect && projects.some(p => p.id_proyecto === projectToSelect)) {
      setSelectedProject(projectToSelect);
      setProjectToSelect(null);
    }
  }, [projectToSelect, projects]);

  const handleAddWasteSuccess = () => {
    fetchProjects();
    // Also need to trigger a refresh of dashboard data
    // The dataRefreshKey from AuthContext can be used for this if available and appropriate
    // Or I can call fetchDashboardData directly.
    // For now, let's assume fetching projects is enough, but this might need adjustment.
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard',
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

        // Add route source and layer with empty data
        map.current.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: []
                }
            },
            lineMetrics: true
        });
        map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            paint: {
                'line-width': 5,
                'line-gradient': ['step', ['line-progress'], '#0d6efd', 0.1, '#0d6efd']
            }
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

    // Cleanup animation from previous render
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }

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
          ubicacion: project.ubicacion,
          latitud: project.latitud,
          longitud: project.longitud
        }
      }));

    source.setData({ type: 'FeatureCollection', features: features });

    const warehouseMarker = new mapboxgl.Marker({ color: '#198754' })
        .setLngLat(BODEGA_COORDS)
        .setPopup(new mapboxgl.Popup().setHTML("<h6>Bodega de Destino</h6>"));

    if (selectedProjectMarker.current) {
        selectedProjectMarker.current.remove();
        selectedProjectMarker.current = null;
    }

    if (selectedProject === 'all') {
      warehouseMarker.remove();
      map.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }});

      if (map.current.getLayer('route')) {
        map.current.setPaintProperty('route', 'line-opacity', 0.8);
      }

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
      const selectedFeature = features.find(f => f.properties.id_proyecto === projectId);

      map.current.setFilter('unclustered-point', ['==', 'id_proyecto', -1]);
      const clusterLayerIds = ['clusters-large', 'clusters-medium', 'clusters-small', 'cluster-count'];
      clusterLayerIds.forEach(id => map.current.setFilter(id, ['==', 'id_proyecto', -1]));

      if (selectedFeature) {
        const projectCoords = selectedFeature.geometry.coordinates;
        const { nombre, ubicacion } = selectedFeature.properties;

        selectedProjectMarker.current = new mapboxgl.Marker({ color: '#0d6efd' })
            .setLngLat(projectCoords)
            .setPopup(new mapboxgl.Popup().setHTML(`<div><strong>${nombre}</strong><br/><span class="text-muted">${ubicacion}</span></div>`))
            .addTo(map.current);
        
        warehouseMarker.addTo(map.current);

        const fetchRoute = async () => {
            try {
                const routeGeometry = await getDirections(projectCoords, BODEGA_COORDS);
                map.current.getSource('route').setData(routeGeometry);
                const bounds = new mapboxgl.LngLatBounds(projectCoords, BODEGA_COORDS);
                map.current.fitBounds(bounds, { padding: 80 });

                const animate = (timestamp) => {
                    const progress = (timestamp / 3000) % 1; // Cycle every 3 seconds
                    const tailLength = 1; // Made the comet longer
                    const start = progress;
                    const end = Math.max(0, start - tailLength);

                    const gradient = [
                        'step',
                        ['line-progress'],
                        'rgba(13, 110, 253, 0)', // Transparent before the tail
                        end, 'rgba(13, 110, 253, 1)', // Opaque at the start of the tail
                        start, 'rgba(13, 110, 253, 0)'  // Transparent after the head
                    ];

                    if (map.current && map.current.getLayer('route')) {
                        map.current.setPaintProperty('route', 'line-gradient', gradient);
                        animationFrameId.current = requestAnimationFrame(animate);
                    } else {
                        if (animationFrameId.current) {
                            cancelAnimationFrame(animationFrameId.current);
                            animationFrameId.current = null;
                        }
                    }
                };
                animationFrameId.current = requestAnimationFrame(animate);

            } catch (routeError) {
                console.error("Error fetching route for dashboard:", routeError);
                map.current.flyTo({ center: projectCoords, zoom: 14 });
            }
        };

        fetchRoute();
      } else {
        map.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }});
        warehouseMarker.remove();
      }
    }
    return () => warehouseMarker.remove();

  }, [isMapLoaded, projects, selectedProject]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!auth.user) return;
      setLoading(true);
      setError(null);
      try {
        const projectId = selectedProject === 'all' ? undefined : selectedProject;
        const [byTypeRes, overTimeRes, impactRes, latestRes] = await Promise.all([
          getSummaryByType(projectId),
          getSummaryOverTime(projectId),
          getEnvironmentalImpact(projectId),
          getLatest(projectId)
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

      <div className={`top-bar ${!isAddProjectModalOpen && !isAddWasteModalOpen ? 'visible' : ''}`}>
        <h1 className="h2 text-black">{selectedProject === 'all' ? 'Dashboard General' : `Proyecto: ${currentProjectDetails?.nombre}`}</h1>
        <div className="d-flex align-items-center">
          <div className="col-auto me-2">
            <select className="form-select" value={selectedProject} onChange={handleProjectChange}>
              <option value="all">Todos los Proyectos</option>
              {projects.map(p => (
                <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button onClick={() => setPanelsVisible(!panelsVisible)} className="btn btn-secondary toggle-panels-btn">
        {panelsVisible ? 'Ocultar Paneles' : 'Mostrar Paneles'}
      </button>

      {isAddProjectModalOpen && (
        <AddProjectModal 
          isOpen={isAddProjectModalOpen} 
          onClose={closeAddProjectModal} 
          onSuccess={handleProjectCreated} 
        />
      )}

      {isAddWasteModalOpen && (
        <AddWasteModal 
          isOpen={isAddWasteModalOpen} 
          onClose={closeAddWasteModal} 
          onSuccess={fetchProjects} 
          proyectos={projects}
        />
      )}

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