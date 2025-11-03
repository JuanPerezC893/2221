const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { registerValidationRules, loginValidationRules, validateRequest } = require('../middleware/validators');
const { sendVerificationEmail, sendNewUserForApprovalEmail, sendPasswordResetEmail } = require('../services/emailService');

// Registrar un nuevo usuario y empresa (si no existe)
router.post('/register', registerValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { nombre, empresa_rut, razon_social, direccion, email, password, tipo_empresa } = req.body;

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
        'INSERT INTO empresas (rut, razon_social, direccion, tipo_empresa) VALUES ($1, $2, $3, $4)',
        [empresa_rut, razon_social, direccion, tipo_empresa]
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
    const userStatus = userRole === 'admin' ? 'aprobado' : 'pendiente'; // Set status based on role
    const newUserResult = await client.query(
      'INSERT INTO usuarios (nombre, rol, empresa_rut, email, password, email_verificado, estado) VALUES ($1, $2, $3, $4, $5, FALSE, $6) RETURNING id_usuario', // Add estado column
      [nombre, userRole, finalEmpresaRut, email, hashedPassword, userStatus]
    );
    const newUser = newUserResult.rows[0];

    // 5. Enviar correos de verificación y notificación (con manejo de errores para no revertir la transacción)
    try {
      const verificationToken = jwt.sign({ id: newUser.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1d' });
      await sendVerificationEmail(email, verificationToken, nombre);
    } catch (emailError) {
      console.error("Error al enviar correo de VERIFICACIÓN de usuario. El registro continuará.", emailError);
    }

    // Si el usuario se une a una empresa existente, notificar a los administradores
    if (userRole === 'usuario') {
      try {
        const adminsResult = await client.query(
          "SELECT nombre, email FROM usuarios WHERE empresa_rut = $1 AND rol = 'admin' AND email_verificado = TRUE",
          [finalEmpresaRut]
        );

        if (adminsResult.rows.length > 0) {
          const { razon_social } = empresaResult.rows[0];
          for (const admin of adminsResult.rows) {
            await sendNewUserForApprovalEmail(admin.email, admin.nombre, nombre, email, razon_social);
          }
        } else {
          console.warn(`No se encontró administrador verificado para la empresa con RUT ${finalEmpresaRut} para notificar sobre el nuevo usuario ${email}.`);
        }
      } catch (emailError) {
        console.error("Error al enviar correo de NOTIFICACIÓN a admin. El registro del usuario continuará.", emailError);
      }
    }

    await client.query('COMMIT');
    
    // Mensaje unificado. El usuario se ha creado. Si los correos fallan, es un problema secundario.
    return res.status(201).json({ message: 'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta. Si no lo recibes, contacta a soporte.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de registro:', error);

    // Improved error handling to give specific feedback
    if (error.code === '23505') { // 23505 is the code for unique_violation in PostgreSQL
      if (error.constraint === 'usuarios_email_key') {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
      }
      // This handles the race condition where two users try to create the same company
      if (error.constraint === 'empresas_pkey') {
        return res.status(400).json({ message: 'El RUT de la empresa ya fue registrado. Intente unirse a la empresa existente.' });
      }
    }
    
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

  // Comparar la contraseña proporcionada con la almacenada
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  // Verificar la integridad de los datos: la empresa asociada debe existir
  const empresaResult = await pool.query('SELECT razon_social, tipo_empresa FROM empresas WHERE rut = $1', [user.empresa_rut]);
  if (empresaResult.rows.length === 0) {
    console.error(`Error de integridad de datos: El usuario ${user.email} está asociado a una empresa con RUT ${user.empresa_rut} que no existe.`);
    return res.status(500).json({ message: 'Error en la configuración de la cuenta. La empresa asociada a tu usuario no fue encontrada. Por favor, contacta a soporte.' });
  }
  const { razon_social, tipo_empresa } = empresaResult.rows[0];

  const tokenPayload = {
    id: user.id_usuario,
    rol: user.rol,
    empresa_rut: user.empresa_rut,
    nombre: user.nombre,
    nombre_empresa: razon_social, // Corregido para usar la variable correcta
    tipo_empresa: tipo_empresa // Añadir el tipo de empresa al payload
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
}));

// Ruta para solicitar el restablecimiento de contraseña
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const token = crypto.randomBytes(20).toString('hex');

        await pool.query(
            'UPDATE usuarios SET reset_password_token = $1, reset_password_expires = NOW() + INTERVAL \'1 hour\' WHERE id_usuario = $2',
            [token, user.id_usuario]
        );

        try {
            await sendPasswordResetEmail(user.email, token, user.nombre);
        } catch (error) {
            console.error("Error al enviar correo de reseteo. La solicitud del usuario falló pero no se informa al cliente por seguridad.", error);
        }
    }
    
    // Por seguridad, siempre se devuelve el mismo mensaje, exista o no el correo.
    res.status(200).json({ message: 'Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.' });
}));

// Ruta para restablecer la contraseña con el token
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, password, password2 } = req.body;

    if (password !== password2) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    const userResult = await pool.query(
        'SELECT * FROM usuarios WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
    );

    if (userResult.rows.length === 0) {
        return res.status(400).json({ message: 'El token para restablecer la contraseña es inválido o ha expirado.' });
    }

    const user = userResult.rows[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
        'UPDATE usuarios SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id_usuario = $2',
        [hashedPassword, user.id_usuario]
    );

    res.status(200).json({ message: 'Tu contraseña ha sido actualizada con éxito.' });
}));

module.exports = router;
