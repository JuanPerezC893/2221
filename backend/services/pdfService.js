const fs = require("fs").promises;
const path = require("path");
const puppeteer = require("puppeteer");

async function crearPDF(proyecto, residuos) {
  try {
    // 1. Leer HTML y CSS base desde las nuevas rutas
    const htmlPath = path.join(__dirname, '../templates/info.html');
    const cssPath = path.join(__dirname, '../templates/stile.css');

    let html = await fs.readFile(htmlPath, "utf8");
    const css = await fs.readFile(cssPath, "utf8");

    // 2. Datos dinámicos del proyecto
    const data = {
      nomProyecto: proyecto.nombre,
      fechaMade: new Date().toLocaleDateString(),
      ubicacion: proyecto.ubicacion,
      fechaInicio: new Date(proyecto.fecha_inicio).toLocaleDateString(),
      fechaTermino: new Date(proyecto.fecha_termino).toLocaleDateString(),
      tonTotales: residuos.reduce((acc, res) => acc + parseFloat(res.cantidad), 0).toFixed(2),
      tonCO2: (residuos.reduce((acc, res) => acc + parseFloat(res.cantidad), 0) * 0.389).toFixed(2) // Estimación
    };

    // 3. Generar filas <tr> para los residuos
    let filasHTML = "";
    if (residuos && residuos.length > 0) {
      for (const residuo of residuos) {
        filasHTML += `
          <tr>
            <td>${residuo.tipo || 'N/A'}</td>
            <td>${residuo.cantidad || 0} T</td>
            <td>${residuo.destino_final || 'N/A'}</td>
            <td>${residuo.certificado || 'No disponible'}</td>
          </tr>
        `;
      }
    } else {
      filasHTML = "<tr><td colspan=\"4\">No hay residuos registrados para este proyecto.</td></tr>";
    }

    // 4. Reemplazar placeholders en el HTML
    for (const key in data) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    }
    html = html.replace("</head>", `<style>${css}</style></head>");
    html = html.replace("{{filas_materiales}}", filasHTML);

    // Manejar la imagen de fondo opcional
    const fondoPath = path.join(__dirname, '../templates/0.jpg');
    try {
      await fs.access(fondoPath);
      html = html.replace("file:///home/jusepecaz/Downloads/0.jpg", "file://" + fondoPath);
    } catch {
      console.log('⚠️  Advertencia: No se encontró la imagen de fondo 0.jpg, se procederá sin ella.');
      html = html.replace(/<img src=\"file:\/\/\/home\/jusepecaz\/Downloads\/0.jpg\" class=\"fondo\">/g, '');
    }

    // 5. Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true
    });

    await browser.close();
    
    console.log("✅ PDF buffer generado con éxito");
    return pdfBuffer;

  } catch (error) {
    console.error("Error al generar el PDF:", error);
    throw new Error("No se pudo generar el informe en PDF.");
  }
}

module.exports = { crearPDF };