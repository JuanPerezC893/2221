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

    console.log("Successfully read HTML and CSS");
    return Buffer.from("dummy pdf content");

  } catch (error) {
    console.error("Error during PDF generation (Stage 1):", error);
    throw new Error("Failed at Stage 1");
  }
}

module.exports = { crearPDF };
