
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrazabilidadPublica, confirmarEntrega } from '../api/trazabilidad';
import './PublicTrazabilidad.css';

const PublicTrazabilidad = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for confirmation form
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [codigoEntrega, setCodigoEntrega] = useState('');
    const [confirmationError, setConfirmationError] = useState(null);
    const [confirmationLoading, setConfirmationLoading] = useState(false);

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

    const handleConfirmSubmit = async (e) => {
        e.preventDefault();
        setConfirmationLoading(true);
        setConfirmationError(null);
        try {
            const response = await confirmarEntrega(id, codigoEntrega);
            setData({ ...data, residuo: response.data.residuo }); // Update state with new data
            setShowConfirmation(false); // Hide form on success
        } catch (err) {
            setConfirmationError(err.response?.data?.message || 'Ocurrió un error al confirmar.');
        } finally {
            setConfirmationLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
          pendiente: 'bg-secondary',
          'en camino': 'bg-primary',
          entregado: 'bg-success',
        };
        return <span className={`badge ${statusStyles[status] || 'bg-dark'}`}>{status}</span>;
    };

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

    const renderConfirmationSection = () => {
        if (residuo.estado === 'entregado') {
            return <div className="alert alert-success mt-4">¡Entrega confirmada exitosamente!</div>;
        }

        if (residuo.estado === 'en camino') {
            return (
                <div className="mt-4">
                    {!showConfirmation ? (
                        <button className="btn btn-primary w-100" onClick={() => setShowConfirmation(true)}>
                            Confirmar Entrega
                        </button>
                    ) : (
                        <form onSubmit={handleConfirmSubmit} className="border p-3 rounded">
                            <h3 className="h5">Confirmar Entrega</h3>
                            <p>Ingrese el código de entrega proporcionado por el transportista.</p>
                            <div className="mb-3">
                                <label htmlFor="codigoEntrega" className="form-label">Código de Entrega</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="codigoEntrega" 
                                    value={codigoEntrega} 
                                    onChange={(e) => setCodigoEntrega(e.target.value)} 
                                    required 
                                />
                            </div>
                            {confirmationError && <div className="alert alert-danger">{confirmationError}</div>}
                            <button type="submit" className="btn btn-success w-100" disabled={confirmationLoading}>
                                {confirmationLoading ? 'Confirmando...' : 'Confirmar'}
                            </button>
                        </form>
                    )}
                </div>
            );
        }
        return null;
    };

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
                        <p><strong>Estado:</strong> {getStatusBadge(residuo.estado)}</p>
                        <p><strong>Proyecto:</strong> {residuo.nombre_proyecto}</p>
                        <p><strong>Empresa:</strong> {residuo.nombre_empresa}</p>
                    </div>

                    {renderConfirmationSection()}

                    <div className="mt-4">
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
