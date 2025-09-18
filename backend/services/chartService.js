const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

// Configuración global para los gráficos
const width = 1200; // Ancho en píxeles
const height = 600; // Alto en píxeles
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
  width, 
  height, 
  backgroundColour: '#ffffff'
});

/**
 * Genera un gráfico de torta (pie chart) a partir de los datos de residuos.
 * @param {Array<Object>} wasteData - Datos de los residuos, ej: [{ tipo: 'Metal', total_cantidad: '150' }]
 * @returns {Promise<string>} Una promesa que resuelve a la imagen del gráfico en formato Data URL (Base64).
 */
async function generatePieChart(wasteData) {
  const labels = wasteData.length > 0 ? wasteData.map(item => item.tipo) : ['Sin Datos'];
  const data = wasteData.length > 0 ? wasteData.map(item => parseFloat(item.total_cantidad)) : [1];

  const configuration = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Distribución de Residuos',
        data: data,
        backgroundColor: wasteData.length > 0 ? ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'] : ['#dee2e6'],
        borderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: {
      devicePixelRatio: 2,
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              size: 30
            }
          }
        }
        //title: {
        //  display: true,
        //  text: 'Distribución de Residuos por Tipo',
        //  font: { size: 50 },
        //}
      }
    }
  };

  const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
  return dataUrl;
}

/**
 * Genera un gráfico de barras a partir de los datos de residuos a lo largo del tiempo.
 * @param {Array<Object>} wasteData - Datos de los residuos, ej: [{ month: '2023-01', total_cantidad: '250' }]
 * @returns {Promise<string>} Una promesa que resuelve a la imagen del gráfico en formato Data URL (Base64).
 */
async function generateBarChart(wasteData) {
  const labels = wasteData.map(item => item.month).sort();
  const data = wasteData.map(item => parseFloat(item.total_cantidad));

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad de Residuos (kg)',
        data: data,
        backgroundColor: 'rgba(13, 110, 253, 0.6)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      devicePixelRatio: 2,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Gestión de Residuos por Mes',
          font: { size: 40 },
          padding: { top: 10, bottom: 20 }
        },
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { font: { size: 30 } }
        },
        y: { 
          beginAtZero: true,
          ticks: { font: { size: 30 } }
        },
      },
    }
  };

  const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
  return dataUrl;
}

module.exports = { generatePieChart, generateBarChart };
