import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapPage = () => {
  const { auth } = useContext(AuthContext);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProyectos = async () => {
      if (auth.user) {
        try {
          setLoading(true);
          const res = await api.get(`/proyectos?empresa_rut=${auth.user.rut}`);
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

  if (loading) {
    return <div className="container mt-5">Cargando mapa...</div>;
  }

  if (error) {
    return <div className="container mt-5 text-danger">Error: {error}</div>;
  }

  if (!auth.user) {
    return <div className="container mt-5">Por favor, inicia sesión para ver el mapa.</div>;
  }

  const defaultPosition = [-33.4489, -70.6693]; // Santiago, Chile coordinates

  return (
    <div className="container mt-4">
      <h1 className="display-5 fw-bold mb-2">Visualización Geográfica de Proyectos</h1>
      <p className="lead text-muted text-center mb-4">Explora la ubicación de tus proyectos registrados.</p>
      <div className="card">
        <div className="card-header bg-primary text-white">
          Ubicación de Proyectos
        </div>
        <div className="card-body">
          <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={false} style={{ height: '500px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {proyectos.map(project => (
              // For now, all markers are at the default position.
              // To show actual project locations, the project data needs latitude and longitude.
              <Marker key={project.id_proyecto} position={defaultPosition}>
                <Popup>
                  <strong>{project.nombre}</strong> <br /> {project.ubicacion}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;