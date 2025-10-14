const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

// Guardar datos de trazabilidad (incluyendo QR)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { id_residuo, qr, ticket } = req.body;
  const { empresa_rut } = req.user; // Get user's company from token

  // ** SECURITY CHECK (IDOR) **
  // Verify that the residuo belongs to the user's company before adding to it.
  const residuoCheck = await pool.query(
    `SELECT 1 
     FROM residuos r
     JOIN proyectos p ON r.id_proyecto = p.id_proyecto
     WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
    [id_residuo, empresa_rut]
  );

  if (residuoCheck.rows.length === 0) {
    return res.status(403).json({ message: 'Acceso denegado. No puede añadir trazabilidad a un residuo que no pertenece a su empresa.' });
  }

  const newTrazabilidad = await pool.query(
    'INSERT INTO trazabilidad (id_residuo, qr, ticket, fecha) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [id_residuo, qr, ticket]
  );
  res.json(newTrazabilidad.rows[0]);
}));


// Obtener datos de trazabilidad para un residuo específico (público)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Obtener información del residuo
  const residuoResult = await pool.query('SELECT r.*, p.nombre as nombre_proyecto, p.latitud, p.longitud, e.razon_social as nombre_empresa FROM residuos r JOIN proyectos p ON r.id_proyecto = p.id_proyecto JOIN empresas e ON p.empresa_rut = e.rut WHERE r.id_residuo = $1', [id]);

  if (residuoResult.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado' });
  }

  // Obtener historial de trazabilidad
  const trazabilidadResult = await pool.query('SELECT * FROM trazabilidad WHERE id_residuo = $1 ORDER BY fecha DESC', [id]);

  res.json({
    residuo: residuoResult.rows[0],
    historial: trazabilidadResult.rows
  });
}));

module.exports = router;

