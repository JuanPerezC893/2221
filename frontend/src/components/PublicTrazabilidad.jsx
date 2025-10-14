
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getTrazabilidadPublica } from '../api/trazabilidad';
import { getDirections } from '../api/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './PublicTrazabilidad.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const PublicTrazabilidad = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mapContainer = useRef(null);
    const map = useRef(null);
    const animationFrameId = useRef(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const BODEGA_COORDS = [-70.773829, -33.40862];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getTrazabilidadPublica(id);
                if (!response.data.residuo.latitud || !response.data.residuo.longitud) {
                    setError('La información de geolocalización para este residuo no está disponible.');
                } else {
                    setData(response.data);
                }
            } catch (err) {
                setError('No se pudo cargar la información de trazabilidad. Verifique el ID e inténtelo de nuevo.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/pelisjuan13/cmfbt9qyo000601s4cgrghz71',
            center: [-70.6693, -33.4489],
            zoom: 9,
        });

        map.current.on('load', () => {
            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [],
                    },
                },
                lineMetrics: true // Enable line metrics
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
            setIsMapLoaded(true);
            // Forzar un redimensionamiento para asegurar que el mapa se dibuje
            setTimeout(() => map.current.resize(), 1);
        });
    }, []);

    useEffect(() => {
        if (!isMapLoaded || !data) return;

        const { latitud, longitud } = data.residuo;
        const projectCoords = [longitud, latitud];

        // Limpiar marcadores anteriores si existen
        const markers = document.querySelectorAll('.mapboxgl-marker');
        markers.forEach(marker => marker.remove());

        // Agregar nuevos marcadores
        new mapboxgl.Marker({ color: '#0d6efd' })
            .setLngLat(projectCoords)
            .setPopup(new mapboxgl.Popup().setHTML("<h6>Punto de Recolección</h6>"))
            .addTo(map.current);

        new mapboxgl.Marker({ color: '#198754' })
            .setLngLat(BODEGA_COORDS)
            .setPopup(new mapboxgl.Popup().setHTML("<h6>Bodega de Destino</h6>"))
            .addTo(map.current);

        const fetchRoute = async () => {
            try {
                const routeGeometry = await getDirections(projectCoords, BODEGA_COORDS);
                // Actualizar la fuente de datos de la ruta ya existente
                map.current.getSource('route').setData(routeGeometry);

                const bounds = new mapboxgl.LngLatBounds(projectCoords, BODEGA_COORDS);
                map.current.fitBounds(bounds, { padding: 80 });

                const animate = (timestamp) => {
                    const progress = (timestamp / 3000) % 1; // Cycle every 3 seconds
                    const tailLength = 0.4;
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
                console.error("Error al dibujar la ruta:", routeError);
                const bounds = new mapboxgl.LngLatBounds(projectCoords, BODEGA_COORDS);
                map.current.fitBounds(bounds, { padding: 80 });
            }
        };

        fetchRoute();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isMapLoaded, data]);

    return (
        <div className="trazabilidad-container">
            <div ref={mapContainer} className="map-background" />

            {loading && (
                <div className="loading-overlay" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 100 }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="alert alert-danger" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                    {error}
                </div>
            )}

            {data && !loading && (
                <div className="side-panel left-panel visible" style={{ width: '450px' }}>
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-primary text-white">
                            <h1 className="h4 mb-0">Trazabilidad del Residuo</h1>
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <h2 className="h5">Detalles del Residuo</h2>
                                <p><strong>ID:</strong> {data.residuo.id_residuo}</p>
                                <p><strong>Tipo:</strong> {data.residuo.tipo}</p>
                                <p><strong>Cantidad:</strong> {data.residuo.cantidad} {data.residuo.unidad}</p>
                                <p><strong>Proyecto:</strong> {data.residuo.nombre_proyecto}</p>
                                <p><strong>Empresa:</strong> {data.residuo.nombre_empresa}</p>
                                <p><strong>Fecha de Creación:</strong> {new Date(data.residuo.fecha_creacion).toLocaleDateString('es-CL')} {new Date(data.residuo.fecha_creacion).toLocaleTimeString('es-CL')}</p>
                            </div>


                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicTrazabilidad;
