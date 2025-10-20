const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');

// Guardar datos de trazabilidad (incluyendo QR)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { id_residuo, qr, ticket } = req.body;
  const { empresa_rut } = req.user;

  const residuoCheck = await pool.query(
    `SELECT 1 FROM residuos r JOIN proyectos p ON r.id_proyecto = p.id_proyecto WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
    [id_residuo, empresa_rut]
  );

  if (residuoCheck.rows.length === 0) {
    return res.status(403).json({ message: 'Acceso denegado. No puede añadir trazabilidad a un residuo que no pertenece a su empresa.' });
  }

  const newTrazabilidad = await pool.query(
    'INSERT INTO trazabilidad (id_residuo, qr, ticket, fecha_evento) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [id_residuo, qr, ticket]
  );
  res.json(newTrazabilidad.rows[0]);
}));

// Ruta para que un GESTOR reclame un residuo
router.post('/reclamar/:id_residuo', authMiddleware, asyncHandler(async (req, res) => {
  const { id_residuo } = req.params;
  const { id: id_usuario_gestor, tipo_empresa } = req.user;

  if (tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado. Solo los gestores de residuos pueden reclamar.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const residuoResult = await client.query("SELECT * FROM residuos WHERE id_residuo = $1 FOR UPDATE", [id_residuo]);
    if (residuoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Residuo no encontrado.' });
    }

    const residuo = residuoResult.rows[0];
    if (residuo.estado.toLowerCase() !== 'pendiente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `El residuo ya no está disponible para ser reclamado. Estado actual: ${residuo.estado}.` });
    }

    const codigo_entrega = Math.floor(10000000 + Math.random() * 90000000).toString();
    await client.query("UPDATE residuos SET estado = 'en camino' WHERE id_residuo = $1", [id_residuo]);

    const nuevoEvento = await client.query(
      'INSERT INTO trazabilidad (id_residuo, id_usuario_gestor, tipo_evento, fecha_evento, codigo_entrega) VALUES ($1, $2, $3, NOW(), $4) RETURNING codigo_entrega',
      [id_residuo, id_usuario_gestor, 'recoleccion', codigo_entrega]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Residuo reclamado exitosamente. Ahora se encuentra \'en camino\'.',
      codigo_entrega: nuevoEvento.rows[0].codigo_entrega
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de reclamar residuo:', error);
    res.status(500).json({ message: 'Error interno al intentar reclamar el residuo.' });
  } finally {
    client.release();
  }
}));

// Obtener datos de trazabilidad para un residuo específico (público)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const residuoResult = await pool.query('SELECT r.*, p.nombre as nombre_proyecto, p.latitud, p.longitud, e.razon_social as nombre_empresa FROM residuos r JOIN proyectos p ON r.id_proyecto = p.id_proyecto JOIN empresas e ON p.empresa_rut = e.rut WHERE r.id_residuo = $1', [id]);

  if (residuoResult.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado' });
  }

  const trazabilidadResult = await pool.query('SELECT * FROM trazabilidad WHERE id_residuo = $1 ORDER BY fecha_evento DESC', [id]);

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

  // Esta validación debe hacerse contra la tabla de trazabilidad ahora
  const eventoResult = await pool.query(
    'SELECT * FROM trazabilidad WHERE id_residuo = $1 AND codigo_entrega = $2 AND tipo_evento = \'recoleccion\'',
    [id, codigo_entrega]
  );

  if (eventoResult.rows.length === 0) {
    return res.status(400).json({ message: 'El código de entrega es incorrecto o no corresponde a este residuo.' });
  }

  const residuoResult = await pool.query('SELECT * FROM residuos WHERE id_residuo = $1', [id]);
  const residuo = residuoResult.rows[0];

  if (residuo.estado.toLowerCase() === 'entregado') {
    return res.status(400).json({ message: 'Esta entrega ya fue confirmada anteriormente.' });
  }

  if (residuo.estado.toLowerCase() !== 'en camino') {
    return res.status(400).json({ message: 'Esta entrega aún no ha sido marcada como \'en camino\'.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar el estado del residuo a 'entregado'
    await client.query(
      "UPDATE residuos SET estado = 'entregado' WHERE id_residuo = $1",
      [id]
    );

    // Añadir el evento de trazabilidad para la entrega
    await client.query(
      'INSERT INTO trazabilidad (id_residuo, tipo_evento, fecha_evento, ticket) VALUES ($1, $2, NOW(), $3)',
      [id, 'entregado', 'Entrega confirmada por el receptor.']
    );

    // Después de actualizar, obtener el objeto completo del residuo para devolverlo
    const fullResiduoQuery = `
      SELECT r.*, p.nombre as nombre_proyecto, p.latitud, p.longitud, e.razon_social as nombre_empresa 
      FROM residuos r 
      JOIN proyectos p ON r.id_proyecto = p.id_proyecto 
      JOIN empresas e ON p.empresa_rut = e.rut 
      WHERE r.id_residuo = $1
    `;
    const updatedResiduoResult = await client.query(fullResiduoQuery, [id]);

    await client.query('COMMIT');
    
    res.json({
      message: '¡Entrega confirmada exitosamente!',
      residuo: updatedResiduoResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de confirmación de entrega:', error);
    res.status(500).json({ message: 'Error al confirmar la entrega.' });
  } finally {
    client.release();
  }
}));

module.exports = router;