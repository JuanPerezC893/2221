const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

// Guardar datos de trazabilidad (incluyendo QR)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { id_residuo, qr, ticket } = req.body;
  const newTrazabilidad = await pool.query(
    'INSERT INTO trazabilidad (id_residuo, qr, ticket, fecha) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [id_residuo, qr, ticket]
  );
  res.json(newTrazabilidad.rows[0]);
}));

module.exports = router;
