import React, { useState, useEffect, useContext } from 'react';
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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

const Dashboard = () => {
  const { auth, dataRefreshKey } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all'); // 'all' or a project ID

  const [wasteSummaryByType, setWasteSummaryByType] = useState([]);
  const [wasteSummaryOverTime, setWasteSummaryOverTime] = useState([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState(null);
  const [latestWasteEntries, setLatestWasteEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // --- Chart Data and Options ---

  const generateMonthLabels = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const labels = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      labels.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
    return labels;
  };

  const barChartLabels = selectedProject === 'all' || !currentProjectDetails
    ? (wasteSummaryOverTime.length > 0 ? wasteSummaryOverTime.map(item => item.month).sort() : ['Sin Datos'])
    : generateMonthLabels(currentProjectDetails.fecha_inicio, currentProjectDetails.fecha_fin);

  const apiDataMap = new Map(wasteSummaryOverTime.map(item => [item.month, parseFloat(item.total_cantidad)]));

  const barChartDataValues = barChartLabels[0] === 'Sin Datos' 
    ? [0] 
    : barChartLabels.map(label => apiDataMap.get(label) || 0);

  const barChartData = {
    labels: barChartLabels,
    datasets: [{
      label: 'Cantidad de Residuos (kg)',
      data: barChartDataValues,
      backgroundColor: 'rgba(13, 110, 253, 0.6)',
      borderColor: 'rgba(13, 110, 253, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  let barChartTitle = 'Gestión de Residuos por Mes';
  if (selectedProject !== 'all' && currentProjectDetails) {
    const startYear = new Date(currentProjectDetails.fecha_inicio).getFullYear();
    const endYear = new Date(currentProjectDetails.fecha_fin).getFullYear();
    barChartTitle = `Progreso Mensual (${startYear === endYear ? startYear : `${startYear}-${endYear}`})`;
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: barChartTitle,
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

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

  if (!auth.user) {
    return <div className="container mt-5">Por favor, inicia sesión para ver el dashboard.</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  const totalWaste = (wasteSummaryByType || []).reduce((sum, item) => sum + parseFloat(item.total_cantidad), 0).toFixed(2);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">{selectedProject === 'all' ? 'Dashboard General' : `Proyecto: ${currentProjectDetails?.nombre}`}</h1>
        <div className="col-4">
          <select className="form-select" value={selectedProject} onChange={handleProjectChange}>
            <option value="all">Consolidado de Todos los Proyectos</option>
            {projects.map(p => (
              <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">Total de Residuos Gestionados</h5>
                  <p className="card-text display-5 fw-bold">{totalWaste} kg</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">CO₂ Ahorrado (Estimado)</h5>
                  <p className="card-text display-5 fw-bold text-success">{environmentalImpact?.co2Avoided || 0} kg</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-muted">% Desviado de Vertedero</h5>
                  <p className="card-text display-5 fw-bold text-info">{environmentalImpact?.percentageDiverted || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-lg-5">
              <div className="card shadow-sm h-100">
                <div className="card-header">Distribución por Tipo</div>
                <div className="card-body d-flex justify-content-center align-items-center">
                  {wasteSummaryByType.length > 0 ? <Pie data={pieChartData} /> : <p className="text-muted">No hay datos de distribución.</p>}
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card shadow-sm h-100">
                <div className="card-header">{barChartTitle}</div>
                <div className="card-body" style={{ height: '300px' }}>
                  {barChartDataValues.some(v => v > 0) ? <Bar data={barChartData} options={barChartOptions} /> : <p className="text-muted">No hay datos de progreso mensual.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">Últimos 5 Registros ({selectedProject === 'all' ? 'Global' : 'del Proyecto'})</div>
            <div className="card-body">
              {latestWasteEntries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Tipo de Residuo</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestWasteEntries.map(entry => (
                        <tr key={entry.id_residuo}>
                          <td>{entry.id_residuo}</td>
                          <td>{entry.tipo}</td>
                          <td>{entry.cantidad} {entry.unidad}</td>
                          <td><span className="badge bg-secondary">{entry.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted p-3">No hay registros recientes de residuos.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
