const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { registerValidationRules, loginValidationRules, validateRequest } = require('../middleware/validators');
const { sendVerificationEmail } = require('../services/emailService');

// Registrar un nuevo usuario y empresa (si no existe)
router.post('/register', registerValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { nombre, empresa_rut, razon_social, email, password } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si el email ya está registrado
    const emailExists = await client.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    // Verificar si la empresa ya existe
    let empresa = await client.query('SELECT * FROM empresas WHERE rut = $1', [empresa_rut]);
    if (empresa.rows.length > 0) {
        // Si la empresa ya existe, no se permite el auto-registro.
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'La empresa ya está registrada. Contacte al administrador para ser añadido.' });
    }

    // Si la empresa no existe, la crea y añade al usuario como admin
    empresa = await client.query(
      'INSERT INTO empresas (rut, razon_social) VALUES ($1, $2) RETURNING *',
      [empresa_rut, razon_social || `Empresa ${empresa_rut}`]
    );
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserResult = await client.query(
      'INSERT INTO usuarios (nombre, rol, empresa_rut, email, password, email_verificado) VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id_usuario',
      [nombre, 'admin', empresa_rut, email, hashedPassword]
    );
    const newUser = newUserResult.rows[0];

    const verificationToken = jwt.sign({ id: newUser.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendVerificationEmail(email, verificationToken);

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Registro exitoso. Por favor, verifica tu correo electrónico.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de registro:', error);

    // Manejo de errores específicos de la base de datos
    if (error.code === '23505') { // Código para violación de unicidad (unique constraint)
      if (error.constraint === 'usuarios_email_key') {
        return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
      } else if (error.constraint === 'empresas_pkey') {
        return res.status(400).json({ message: 'El RUT de la empresa ya está registrado.' });
      }
      return res.status(400).json({ message: 'El correo o RUT ya existen.' });
    }

    // Error genérico
    res.status(500).json({ message: 'Error al registrar el usuario. Por favor, intente de nuevo.' });
  } finally {
    client.release();
  }
}));

router.get('/verify-email/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(400).send('Usuario no encontrado.');
        }

        if (userResult.rows[0].email_verificado) {
            // Redirigir al login con un mensaje de que ya está verificado
            return res.redirect(`${process.env.FRONTEND_URL}/login?verified=already`);
        }

        await pool.query('UPDATE usuarios SET email_verificado = TRUE WHERE id_usuario = $1', [userId]);

        // Redirigir al login con un mensaje de éxito
        res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

    } catch (error) {
        console.error('Error de verificación de token:', error);
        // Redirigir a una página de error en el frontend
        res.redirect(`${process.env.FRONTEND_URL}/verification-failed`);
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

  if (!user.email_verificado) {
    return res.status(403).json({ message: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const tokenPayload = {
    id: user.id_usuario,
    rol: user.rol,
    empresa_rut: user.empresa_rut,
    nombre: user.nombre // Añadir el nombre al payload del token
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
}));

module.exports = router;
