import React, { useState, useEffect, useContext, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

// TODO: Replace with your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapPage = () => {
  const { auth } = useContext(AuthContext);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProyectos = async () => {
      if (auth.user) {
        try {
          setLoading(true);
          const res = await api.get('/proyectos');
          setProyectos(res.data);
        } catch (err) {
          console.error('Error fetching projects:', err.response?.data || err.message);
          setError('Error al cargar proyectos.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProyectos();
  }, [auth]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard',
        center: [-70.6693, -33.4489],
        zoom: 12
      });
    }
  });

  useEffect(() => {
    if (!map.current) return;

    proyectos.forEach(project => {
      if (project.latitud && project.longitud) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div><strong>${project.nombre}</strong><br/><span class="text-muted">${project.ubicacion}</span><br/><small>Coords: ${project.latitud}, ${project.longitud}</small></div>`);

        new mapboxgl.Marker()
          .setLngLat([project.longitud, project.latitud])
          .setPopup(popup)
          .addTo(map.current);
      }
    });
  }, [proyectos]);

  if (loading) {
    return <div className="container mt-5">Cargando mapa...</div>;
  }

  if (error) {
    return <div className="container mt-5 text-danger">Error: {error}</div>;
  }

  if (!auth.user) {
    return <div className="container mt-5">Por favor, inicia sesión para ver el mapa.</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="display-5 fw-bold mb-2">Visualización Geográfica de Proyectos</h1>
      <p className="lead text-muted text-center mb-4">Explora la ubicación de tus proyectos registrados.</p>
      <div className="card">
        <div className="card-header bg-primary text-white">
          Ubicación de Proyectos
        </div>
        <div className="card-body">
          <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
