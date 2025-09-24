const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Obtener datos de la empresa del usuario autenticado
router.get('/me', asyncHandler(async (req, res) => {
  const { empresa_rut } = req.user;

  if (!empresa_rut) {
    return res.status(404).json({ message: 'El usuario no está asociado a ninguna empresa.' });
  }

  const empresa = await pool.query(
    'SELECT rut, razon_social, direccion FROM empresas WHERE rut = $1',
    [empresa_rut]
  );

  if (empresa.rows.length === 0) {
    return res.status(404).json({ message: 'Empresa no encontrada.' });
  }

  res.json(empresa.rows[0]);
}));

// Actualizar datos de la empresa (ejemplo para el futuro)
router.put('/me', asyncHandler(async (req, res) => {
    const { empresa_rut } = req.user;
    const { razon_social, direccion } = req.body;

    if (!razon_social || !direccion) {
        return res.status(400).json({ message: 'Razón social y dirección son requeridos.' });
    }

    const updatedEmpresa = await pool.query(
        'UPDATE empresas SET razon_social = $1, direccion = $2 WHERE rut = $3 RETURNING *',
        [razon_social, direccion, empresa_rut]
    );

    if (updatedEmpresa.rows.length === 0) {
        return res.status(404).json({ message: 'Empresa no encontrada.' });
    }

    res.json(updatedEmpresa.rows[0]);
}));

module.exports = router;
