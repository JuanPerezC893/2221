const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Obtener la lista de residuos reclamados por el gestor logueado
router.get('/mis-residuos', asyncHandler(async (req, res) => {
  const { id: id_usuario_gestor, tipo_empresa } = req.user;

  // 1. Verificar que el usuario es un gestor
  if (tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado. Esta función es solo para gestores.' });
  }

  // 2. Consultar los residuos reclamados por el gestor
  const query = `
    SELECT
      r.id_residuo,
      r.tipo,
      r.cantidad,
      r.unidad,
      r.estado,
      p.nombre AS nombre_proyecto,
      t.fecha_evento AS fecha_recoleccion,
      t.codigo_entrega
    FROM
      residuos r
    JOIN
      trazabilidad t ON r.id_residuo = t.id_residuo
    JOIN
      proyectos p ON r.id_proyecto = p.id_proyecto
    WHERE
      t.id_usuario_gestor = $1 AND t.tipo_evento = 'recoleccion'
    ORDER BY
      t.fecha_evento DESC
  `;

  const misResiduos = await pool.query(query, [id_usuario_gestor]);

  // 3. Devolver resultados
  res.json(misResiduos.rows);
}));

module.exports = router;
