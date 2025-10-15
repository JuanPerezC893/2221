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

// Confirmar la entrega de un residuo (público)
router.post('/:id/confirmar-entrega', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { codigo_entrega } = req.body;

  if (!codigo_entrega) {
    return res.status(400).json({ message: 'El código de entrega es requerido.' });
  }

  const residuoResult = await pool.query('SELECT * FROM residuos WHERE id_residuo = $1', [id]);

  if (residuoResult.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado.' });
  }

  const residuo = residuoResult.rows[0];

  if (residuo.estado === 'entregado') {
    return res.status(400).json({ message: 'Esta entrega ya fue confirmada anteriormente.' });
  }

  if (residuo.estado !== 'en camino') {
    return res.status(400).json({ message: 'Esta entrega aún no ha sido marcada como \'en camino\'.' });
  }

  if (residuo.codigo_entrega !== codigo_entrega) {
    return res.status(400).json({ message: 'El código de entrega es incorrecto.' });
  }

  // Si todo es correcto, actualizar el estado a 'entregado'
  const updatedResiduo = await pool.query(
    "UPDATE residuos SET estado = 'entregado' WHERE id_residuo = $1 RETURNING *",
    [id]
  );

  res.json({ 
    message: '¡Entrega confirmada exitosamente!',
    residuo: updatedResiduo.rows[0]
  });
}));

module.exports = router;

