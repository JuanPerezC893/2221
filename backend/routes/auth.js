const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { registerValidationRules, loginValidationRules, validateRequest } = require('../middleware/validators');

// Registrar un nuevo usuario y empresa (si no existe)
router.post('/register', registerValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { nombre, empresa_rut, razon_social, email, password } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si el email ya está registrado en cualquier empresa
    const emailExists = await client.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    // Buscar o crear la empresa
    let empresa = await client.query('SELECT * FROM empresas WHERE rut = $1', [empresa_rut]);
    if (empresa.rows.length === 0) {
      // Si la empresa no existe, la crea con el primer usuario como admin
      empresa = await client.query(
        'INSERT INTO empresas (rut, razon_social) VALUES ($1, $2) RETURNING *',
        [empresa_rut, razon_social || `Empresa ${empresa_rut}`]
      );
      // El primer usuario de una nueva empresa será administrador
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = await client.query(
        'INSERT INTO usuarios (nombre, rol, empresa_rut, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nombre, rol, empresa_rut, email',
        [nombre, 'admin', empresa_rut, email, hashedPassword]
      );
      await client.query('COMMIT');
      return res.status(201).json(newUser.rows[0]);
    } else {
      // Si la empresa ya existe, no se permite el auto-registro.
      // En una aplicación real, esto sería un sistema de invitación.
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'La empresa ya está registrada. Contacte al administrador para ser añadido.' });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de registro:', error);
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  } finally {
    client.release();
  }
}));

// Iniciar sesión
router.post('/login', loginValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

  if (userResult.rows.length === 0) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const user = userResult.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  // Incluir id, rol y empresa_rut en el token para usarlo en el middleware de autorización
  const tokenPayload = {
    id: user.id_usuario,
    rol: user.rol,
    empresa_rut: user.empresa_rut
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
}));

module.exports = router;
