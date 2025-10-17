const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Middleware para asegurar que solo los gestores accedan a estas rutas
const gestorOnly = (req, res, next) => {
  if (req.user.tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  next();
};

// Obtener tipos de residuos únicos de residuos pendientes
router.get('/tipos-residuo', gestorOnly, asyncHandler(async (req, res) => {
  const query = `
    SELECT DISTINCT r.tipo
    FROM residuos r
    WHERE LOWER(r.estado) = 'pendiente'
    ORDER BY r.tipo;
  `;
  const result = await pool.query(query);
  res.json(result.rows.map(row => row.tipo));
}));

// Obtener ciudades únicas de residuos pendientes
router.get('/ciudades', gestorOnly, asyncHandler(async (req, res) => {
  const query = `
    SELECT DISTINCT p.ubicacion
    FROM residuos r
    JOIN proyectos p ON r.id_proyecto = p.id_proyecto
    WHERE LOWER(r.estado) = 'pendiente' AND p.ubicacion IS NOT NULL
    ORDER BY p.ubicacion;
  `;
  const result = await pool.query(query);
  res.json(result.rows.map(row => row.ubicacion));
}));

// Obtener empresas únicas de residuos pendientes
router.get('/empresas', gestorOnly, asyncHandler(async (req, res) => {
  const query = `
    SELECT DISTINCT e.razon_social
    FROM residuos r
    JOIN proyectos p ON r.id_proyecto = p.id_proyecto
    JOIN empresas e ON p.empresa_rut = e.rut
    WHERE LOWER(r.estado) = 'pendiente'
    ORDER BY e.razon_social;
  `;
  const result = await pool.query(query);
  res.json(result.rows.map(row => row.razon_social));
}));

module.exports = router;
