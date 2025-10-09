
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrazabilidadPublica } from '../api/trazabilidad';
import './PublicTrazabilidad.css';

const PublicTrazabilidad = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getTrazabilidadPublica(id);
                setData(response.data);
                setError(null);
            } catch (err) {
                setError('No se pudo cargar la información de trazabilidad. Verifique el ID e inténtelo de nuevo.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="trazabilidad-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="trazabilidad-container"><div className="alert alert-danger">{error}</div></div>;
    }

    if (!data) {
        return null;
    }

    const { residuo, historial } = data;

    return (
        <div className="trazabilidad-container">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h1 className="h4 mb-0">Trazabilidad del Residuo</h1>
                </div>
                <div className="card-body">
                    <div className="mb-4">
                        <h2 className="h5">Detalles del Residuo</h2>
                        <p><strong>ID:</strong> {residuo.id_residuo}</p>
                        <p><strong>Tipo:</strong> {residuo.tipo}</p>
                        <p><strong>Cantidad:</strong> {residuo.cantidad} {residuo.unidad}</p>
                        <p><strong>Proyecto:</strong> {residuo.nombre_proyecto}</p>
                        <p><strong>Empresa:</strong> {residuo.nombre_empresa}</p>
                        <p><strong>Fecha de Creación:</strong> {new Date(residuo.fecha_creacion).toLocaleString()}</p>
                    </div>

                    <div>
                        <h2 className="h5">Historial de Movimientos</h2>
                        {historial.length > 0 ? (
                            <ul className="list-group">
                                {historial.map(evento => (
                                    <li key={evento.id_trazabilidad} className="list-group-item">
                                        <p className="mb-1"><strong>Fecha:</strong> {new Date(evento.fecha).toLocaleString()}</p>
                                        <p className="mb-1"><strong>Ticket:</strong> {evento.ticket || 'N/A'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted">No hay historial de movimientos para este residuo.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicTrazabilidad;
