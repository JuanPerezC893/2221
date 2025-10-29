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
      r.url_certificado, -- Añadir url_certificado
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

// Actualizar el estado de un residuo reclamado
router.put('/residuos/:id/estado', asyncHandler(async (req, res) => {
  const { id: id_residuo } = req.params;
  const { estado } = req.body;
  const { id: id_usuario_gestor, tipo_empresa } = req.user;

  // 1. Verificar que el usuario es un gestor
  if (tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado. Esta función es solo para gestores.' });
  }

  // 2. Verificar que el estado proporcionado es válido
  if (!estado) {
    return res.status(400).json({ message: 'El campo estado es requerido.' });
  }

  // 3. Verificar que el residuo fue reclamado por este gestor antes de actualizar
  const checkQuery = `
    SELECT 1 FROM trazabilidad
    WHERE id_residuo = $1 AND id_usuario_gestor = $2 AND tipo_evento = 'recoleccion'
  `;
  const checkResult = await pool.query(checkQuery, [id_residuo, id_usuario_gestor]);

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado o no reclamado por este gestor.' });
  }

  // 4. Actualizar el estado del residuo
  const updateQuery = `
    UPDATE residuos SET estado = $1 WHERE id_residuo = $2 RETURNING *
  `;
  const updatedResiduo = await pool.query(updateQuery, [estado, id_residuo]);

  // 5. Devolver el residuo actualizado
  res.json(updatedResiduo.rows[0]);
}));

module.exports = router;
