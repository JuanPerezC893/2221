const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const { Chart, registerables } = require('chart.js');

// --- START: Color Logic ---
const WASTE_TYPE_COLORS = {
  'Hormigón': '#1f77b4',
  'Ladrillos': '#ff7f0e',
  'Tierra': '#2ca02c',
  'Piedras': '#d62728',
  'Asfalto': '#9467bd',
  'Madera': '#8c564b',
  'Metales': '#e377c2',
  'Plásticos': '#7f7f7f',
  'Papel': '#bcbd22',
  'Cartón': '#17becf'
};
const DEFAULT_COLOR = '#adb5bd';

const getChartColors = (labels) => {
  if (!labels || labels.length === 0) {
    return [DEFAULT_COLOR];
  }
  return labels.map(label => WASTE_TYPE_COLORS[label] || DEFAULT_COLOR);
};
// --- END: Color Logic ---

// Registrar la fuente
const fontPath = path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf');
if (require('fs').existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'DejaVu Sans');
} else {
  console.error('Archivo de fuente no encontrado en:', fontPath);
}

Chart.register(...registerables);

const width = 1000;
const height = 600;
const width2 = 1800;
const height2 = 600;

async function generatePieChart(wasteData) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const labels = wasteData.length > 0 ? wasteData.map(item => item.tipo) : ['Sin Datos'];
  const data = wasteData.length > 0 ? wasteData.map(item => parseFloat(item.total_cantidad)) : [1];

  const configuration = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Distribución de Residuos',
        data: data,
        backgroundColor: getChartColors(labels),
        borderColor: '#fff',
        borderWidth: 6,
      }],
    },
    options: {
      animation: false,
      devicePixelRatio: 10,
      responsive: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              size: 36,
              family: 'DejaVu Sans'
            }
          }
        }
      }
    }
  };

  new Chart(ctx, configuration);

  return canvas.toDataURL('image/png');
}

async function generateBarChart(wasteData) {
  const canvas = createCanvas(width2, height2);
  const ctx = canvas.getContext('2d');

  const labels = wasteData.map(item => item.month).sort();
  const data = wasteData.map(item => parseFloat(item.total_cantidad));

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad de Residuos (kg)',
        data: data,
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      animation: false,
      devicePixelRatio: 2,
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Gestión de Residuos por Mes',
          font: { size: 36, family: 'DejaVu Sans' },
          padding: { top: 10, bottom: 20 }
        },
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { font: { size: 30, family: 'DejaVu Sans' } }
        },
        y: { 
          beginAtZero: true,
          ticks: { font: { size: 30, family: 'DejaVu Sans' } }
        },
      },
    }
  };

  new Chart(ctx, configuration);

  return canvas.toDataURL('image/png');
}

module.exports = { generatePieChart, generateBarChart };