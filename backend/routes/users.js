const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { validateRequest, createUserValidationRules } = require('../middleware/validators');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Endpoint to create a new user by an admin
router.post('/create-by-admin', 
  adminOnly, 
  createUserValidationRules(), 
  validateRequest, 
  asyncHandler(async (req, res) => {
    const { nombre, email, password, rol, rut_personal } = req.body;
    const { empresa_rut } = req.user; // Get company RUT from admin's token

    // Check if email already exists
    const emailExists = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    // Check if personal RUT already exists
    const rutExists = await pool.query('SELECT 1 FROM usuarios WHERE rut_personal = $1', [rut_personal]);
    if (rutExists.rows.length > 0) {
      return res.status(400).json({ message: 'El RUT personal ya está en uso.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUserResult = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, empresa_rut, rut_personal, email_verificado) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id_usuario, nombre, email, rol, rut_personal',
      [nombre, email, hashedPassword, rol, empresa_rut, rut_personal]
    );

    res.status(201).json(newUserResult.rows[0]);
}));

// Obtener datos del usuario autenticado (reemplaza a /api/auth/me)
router.get('/me', asyncHandler(async (req, res) => {
  const user = await pool.query(
    'SELECT id_usuario, nombre, rol, empresa_rut, email FROM usuarios WHERE id_usuario = $1',
    [req.user.id] // req.user es establecido por authMiddleware
  );
  if (user.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }
  res.json(user.rows[0]);
}));

// Obtener todos los usuarios de la misma empresa
router.get('/', asyncHandler(async (req, res) => {
  const { empresa_rut } = req.user; // El rut de la empresa se obtiene del token

  const users = await pool.query(
    'SELECT id_usuario, nombre, email, rol, rut_personal FROM usuarios WHERE empresa_rut = $1 ORDER BY nombre',
    [empresa_rut]
  );

  res.json(users.rows);
}));

// Actualizar datos del perfil del usuario autenticado
router.put('/me', asyncHandler(async (req, res) => {
  const { nombre } = req.body; // Email removed
  const { id } = req.user;

  if (!nombre) {
    return res.status(400).json({ message: 'Nombre es requerido.' });
  }

  const updatedUser = await pool.query(
    'UPDATE usuarios SET nombre = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre, rol, empresa_rut, email',
    [nombre, id]
  );

  if (updatedUser.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  res.json(updatedUser.rows[0]);
}));

// Cambiar la contraseña del usuario autenticado
router.post('/me/change-password', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'La contraseña actual y la nueva son requeridas.' });
  }

  const userResult = await pool.query('SELECT password FROM usuarios WHERE id_usuario = $1', [id]);
  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const user = userResult.rows[0];

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await pool.query('UPDATE usuarios SET password = $1 WHERE id_usuario = $2', [hashedPassword, id]);

  res.json({ message: 'Contraseña actualizada correctamente.' });
}));

// Eliminar la cuenta del usuario autenticado
router.delete('/me', asyncHandler(async (req, res) => {
    const { id, empresa_rut } = req.user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Opcional: ¿Qué pasa si es el último administrador de una empresa?
        // Por ahora, permitimos la eliminación.

        // Eliminar al usuario
        const deletedUser = await client.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);

        // Si el usuario era el único en la empresa, también eliminamos la empresa.
        const usersInCompany = await client.query('SELECT 1 FROM usuarios WHERE empresa_rut = $1', [empresa_rut]);
        if (usersInCompany.rows.length === 0) {
            // La lógica de eliminación en cascada de proyectos y residuos debe manejarse aquí o en la BD.
            const proyectos = await client.query('SELECT id_proyecto FROM proyectos WHERE empresa_rut = $1', [empresa_rut]);
            const projectIds = proyectos.rows.map(p => p.id_proyecto);

            if (projectIds.length > 0) {
                await client.query('DELETE FROM trazabilidad WHERE id_residuo IN (SELECT id_residuo FROM residuos WHERE id_proyecto = ANY($1::int[]))', [projectIds]);
                await client.query('DELETE FROM residuos WHERE id_proyecto = ANY($1::int[])', [projectIds]);
                await client.query('DELETE FROM proyectos WHERE empresa_rut = $1', [empresa_rut]);
            }
            
            await client.query('DELETE FROM empresas WHERE rut = $1', [empresa_rut]);
            console.log(`Empresa ${empresa_rut} eliminada por ser el último usuario.`);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Usuario y datos asociados eliminados correctamente.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción de eliminación de usuario:', error);
        res.status(500).json({ message: 'Error al eliminar la cuenta.' });
    } finally {
        client.release();
    }
}));


module.exports = router;