const emailjs = require('@emailjs/nodejs');

const sendVerificationEmail = async (userEmail, token, companyName) => {
  // Initialize EmailJS right before sending the email.
  // This ensures that the environment variables are loaded.
  emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  });

  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  const templateParams = {
    link: verificationUrl,
    email: userEmail.trim(),
    name: companyName,
  };

  const serviceID = process.env.EMAILJS_SERVICE_ID;
  const templateID = process.env.EMAILJS_TEMPLATE_ID;

  if (!serviceID || !templateID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
      console.error('Missing EmailJS environment variables for sending email.');
      throw new Error('Missing EmailJS environment variables');
  }

  try {
    const response = await emailjs.send(serviceID, templateID, templateParams);
    console.log('Correo de verificación enviado a:', userEmail);
    return response;
  } catch (error) {
    console.error('Error al enviar el correo de verificación con EmailJS:', error);
    throw new Error('No se pudo enviar el correo de verificación.');
  }
};

module.exports = { sendVerificationEmail };
