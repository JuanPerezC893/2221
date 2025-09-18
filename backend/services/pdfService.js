const fs = require("fs").promises;
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const pool = require("../db"); // Para consultas a la BD
const { generatePieChart, generateBarChart } = require("./chartService"); // Nuestro nuevo servicio

async function crearPDF(proyecto, residuos) {
  try {
    // 1. Obtener datos para los gráficos
    const projectId = proyecto.id_proyecto;
    const summaryByTypeQuery = pool.query(
      `SELECT tipo, SUM(cantidad) as total_cantidad
       FROM residuos
       WHERE id_proyecto = $1
       GROUP BY tipo
       ORDER BY total_cantidad DESC`,
      [projectId]
    );

    const summaryOverTimeQuery = pool.query(
      `SELECT TO_CHAR(t.fecha, 'YYYY-MM') as month, SUM(r.cantidad) as total_cantidad
       FROM residuos r
       JOIN trazabilidad t ON r.id_residuo = t.id_residuo
       WHERE r.id_proyecto = $1
       GROUP BY month
       ORDER BY month`,
      [projectId]
    );

    const [summaryByTypeResult, summaryOverTimeResult] = await Promise.all([summaryByTypeQuery, summaryOverTimeQuery]);

    // 2. Generar imágenes de los gráficos
    const pieChartImagePromise = generatePieChart(summaryByTypeResult.rows);
    const barChartImagePromise = generateBarChart(summaryOverTimeResult.rows);
    
    const [pieChartImage, barChartImage] = await Promise.all([pieChartImagePromise, barChartImagePromise]);

    const graficoTortaImg = `<img src="${pieChartImage}" alt="Gráfico Circular" style="width: 70%; height: auto; display: block; margin-left: auto; margin-right: auto;"/>`;
    const graficoBarrasImg = `<img src="${barChartImage}" alt="Gráfico de Barras" style="width: 70%; height: auto; display: block; margin-left: auto; margin-right: auto;"/>`;

    // 1. Leer HTML y CSS base
    const htmlPath = path.join(__dirname, "../templates/info.html");
    const cssPath = path.join(__dirname, "../templates/stile.css");
    let html = await fs.readFile(htmlPath, "utf8");
    const css = await fs.readFile(cssPath, "utf8");

    // 2. Datos dinámicos
    const data = {
      nomProyecto: proyecto.nombre,
      fechaMade: new Date().toLocaleDateString(),
      ubicacion: proyecto.ubicacion,
      fechaInicio: new Date(proyecto.fecha_inicio).toLocaleDateString(),
      fechaTermino: new Date(proyecto.fecha_termino).toLocaleDateString(),
      tonTotales: residuos.reduce(
        (acc, res) => acc + parseFloat(res.cantidad),
        0
      ).toFixed(2),
      tonCO2: (
        residuos.reduce((acc, res) => acc + parseFloat(res.cantidad), 0) *
        0.389
      ).toFixed(2),
    };

    // 3. Generar filas
    let filasHTML = "";
    if (residuos && residuos.length > 0) {
      for (const residuo of residuos) {
        filasHTML += `
          <tr>
            <td>${residuo.tipo || "N/A"}</td>
            <td>${residuo.cantidad || 0} T</td>
            <td>${residuo.destino_final || "N/A"}</td>
            <td>${residuo.certificado || "No disponible"}</td>
          </tr>
        `;
      }
    } else {
      filasHTML = `<tr><td colspan="4">No hay residuos registrados.</td></tr>`;
    }

    // 4. Reemplazar placeholders
    for (const key in data) {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, data[key]);
    }
    html = html.replace("</head>", `<style>${css}</style></head>`);
    html = html.replace("{{filas_materiales}}", filasHTML);
    html = html.replace("{{graficoBarras}}", graficoBarrasImg);
    html = html.replace("{{graficoTorta}}", graficoTortaImg);

    // Manejar la imagen de fondo opcional
    const fondoPath = path.join(__dirname, "../templates/0.jpg");
    try {
      await fs.access(fondoPath);
      html = html.replace(
        "file:///home/jusepecaz/Downloads/0.jpg",
        "file://" + fondoPath
      );
    } catch (err) {
      console.warn("No se encontró la imagen de fondo, se omite.");
    }

    // 5. Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw error;
  }
}

// Exportar la función
module.exports = { crearPDF };

