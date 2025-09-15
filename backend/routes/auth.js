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

    // 1. Verificar si el email ya está registrado
    const emailExists = await client.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    let userRole = 'usuario'; // Default role for new users joining an existing company
    let finalEmpresaRut = empresa_rut; // Use the provided RUT

    // 2. Verificar si la empresa ya existe
    const empresaResult = await client.query('SELECT * FROM empresas WHERE rut = $1', [empresa_rut]);

    if (empresaResult.rows.length === 0) {
      // Si la empresa NO existe, la crea y el primer usuario es 'admin'
      await client.query(
        'INSERT INTO empresas (rut, razon_social) VALUES ($1, $2)',
        [empresa_rut, razon_social || `Empresa ${empresa_rut}`]
      );
      userRole = 'admin'; // First user of a new company is admin
    } else {
      // Si la empresa YA existe, el nuevo usuario se une a ella como 'usuario'
      // No se necesita hacer nada aquí, userRole ya es 'usuario'
    }

    // 3. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insertar el nuevo usuario
    const newUserResult = await client.query(
      'INSERT INTO usuarios (nombre, rol, empresa_rut, email, password, email_verificado) VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id_usuario', // email_verificado set to FALSE
      [nombre, userRole, finalEmpresaRut, email, hashedPassword]
    );
    const newUser = newUserResult.rows[0];

    // 5. Generar y enviar token de verificación de email
    const verificationToken = jwt.sign({ id: newUser.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendVerificationEmail(email, verificationToken, razon_social || `Empresa ${empresa_rut}`); // Added companyName

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Registro exitoso. Por favor, verifica tu correo electrónico.' }); // Original success message

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de registro:', error); // Log the full error object for debugging

    // Simplified error handling for debugging
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