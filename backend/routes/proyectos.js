
const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { projectValidationRules, validateRequest } = require('../middleware/validators');
const authMiddleware = require('../middleware/auth');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Obtener todos los proyectos de la empresa del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { empresa_rut } = req.user;
  const proyectos = await pool.query('SELECT * FROM proyectos WHERE empresa_rut = $1', [empresa_rut]);
  res.json(proyectos.rows);
}));

// Crear un nuevo proyecto
router.post('/', projectValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { nombre, ubicacion, fecha_inicio, fecha_fin } = req.body;
  const { empresa_rut } = req.user; // Usar el rut de la empresa del token
  const newProject = await pool.query(
    'INSERT INTO proyectos (nombre, ubicacion, fecha_inicio, fecha_fin, empresa_rut) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [nombre, ubicacion, fecha_inicio, fecha_fin, empresa_rut]
  );
  res.status(201).json(newProject.rows[0]);
}));

// Obtener un proyecto por ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;
  const proyecto = await pool.query('SELECT * FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id, empresa_rut]);

  if (proyecto.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }
  res.json(proyecto.rows[0]);
}));

// Actualizar un proyecto
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, fecha_inicio, fecha_fin } = req.body;
  const { empresa_rut } = req.user;

  const updatedProject = await pool.query(
    'UPDATE proyectos SET nombre = $1, ubicacion = $2, fecha_inicio = $3, fecha_fin = $4 WHERE id_proyecto = $5 AND empresa_rut = $6 RETURNING *',
    [nombre, ubicacion, fecha_inicio, fecha_fin, id, empresa_rut]
  );

  if (updatedProject.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }
  res.json(updatedProject.rows[0]);
}));

// Eliminar un proyecto
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;

  // Primero, verificar que el proyecto pertenece a la empresa del usuario
  const proyecto = await pool.query('SELECT * FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id, empresa_rut]);

  if (proyecto.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }

  // La base de datos debería tener ON DELETE CASCADE para manejar la eliminación en cascada.
  // Si no, la lógica manual es necesaria, pero es menos eficiente.
  // Asumiendo que ON DELETE CASCADE está configurado en la DDL para `residuos` y `trazabilidad`.
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Eliminar la trazabilidad de los residuos asociados al proyecto
    await client.query(`
      DELETE FROM trazabilidad
      WHERE id_residuo IN (SELECT id_residuo FROM residuos WHERE id_proyecto = $1)
    `, [id]);

    // 2. Eliminar los residuos asociados al proyecto
    await client.query('DELETE FROM residuos WHERE id_proyecto = $1', [id]);

    // 3. Eliminar el proyecto
    const deleteProjectResult = await client.query('DELETE FROM proyectos WHERE id_proyecto = $1', [id]);

    if (deleteProjectResult.rowCount > 0) {
        await client.query('COMMIT');
        res.status(200).json({ message: 'Proyecto y todos sus datos asociados eliminados correctamente.' });
    } else {
        // Esto puede ocurrir si el proyecto fue eliminado en otra transacción
        await client.query('ROLLBACK');
        res.status(404).json({ message: 'El proyecto no pudo ser eliminado, puede que ya no exista.' });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de eliminación:', error);
    res.status(500).json({ message: 'Error al eliminar el proyecto.' });
  } finally {
    client.release();
  }
}));

module.exports = router;
