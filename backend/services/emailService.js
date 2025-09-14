const emailjs = require('@emailjs/browser');

const sendVerificationEmail = async (userEmail, token) => {
  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  try {
    await emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, {
      link: verificationUrl,
      email: userEmail,
    }, {
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY
    });
    console.log('Correo de verificación enviado a:', userEmail);
  } catch (error) {
    console.error('Error al enviar el correo de verificación con EmailJS:', error);
    throw new Error('No se pudo enviar el correo de verificación.');
  }
};

module.exports = { sendVerificationEmail };
