const nodemailer = require('nodemailer');

// Configuración del transportador de correo usando variables de entorno
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu dirección de correo de Gmail
    pass: process.env.EMAIL_PASS, // La contraseña de aplicación de Gmail
  },
});

/**
 * Envía un correo de verificación al usuario.
 * @param {string} userEmail - El email del destinatario.
 * @param {string} token - El token de verificación.
 */
const sendVerificationEmail = async (userEmail, token) => {
  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  const mailOptions = {
    from: `"Gestión de Residuos" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Verifica tu cuenta en Gestión de Residuos',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Bienvenido a Gestión de Residuos</h2>
        <p>Gracias por registrarte. Por favor, haz clic en el siguiente botón para verificar tu correo electrónico:</p>
        <a href="${verificationUrl}" style="background-color: #3b5998; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Verificar Correo</a>
        <p style="margin-top: 20px;">Si el botón no funciona, copia y pega la siguiente URL en tu navegador:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">Si no te registraste en nuestro sitio, por favor ignora este mensaje.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de verificación enviado a:', userEmail);
  } catch (error) {
    console.error('Error al enviar el correo de verificación:', error);
    throw new Error('No se pudo enviar el correo de verificación.');
  }
};

module.exports = { sendVerificationEmail };
