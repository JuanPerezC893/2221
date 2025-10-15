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

const sendNewUserForApprovalEmail = async (adminEmail, adminName, newUserName, newUserEmail, companyName) => {
  emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  });

  const templateParams = {
    admin_name: adminName,
    new_user_name: newUserName,
    new_user_email: newUserEmail,
    company_name: companyName,
    email: adminEmail.trim(),
    login_url: `${process.env.FRONTEND_URL}/perfil`
  };

  const serviceID = process.env.EMAILJS_SERVICE_ID;
  const templateID = process.env.EMAILJS_NEW_USER_TEMPLATE_ID;

  if (!serviceID || !templateID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
      console.error('Missing EmailJS environment variables for sending new user notification.');
      throw new Error('Missing EmailJS environment variables');
  }

  try {
    const response = await emailjs.send(serviceID, templateID, templateParams);
    console.log(`Correo de notificación de nuevo usuario enviado a admin: ${adminEmail}`);
    return response;
  } catch (error) {
    console.error('Error al enviar el correo de notificación con EmailJS:', error);
    throw new Error('No se pudo enviar el correo de notificación.');
  }
};

const sendPasswordResetEmail = async (userEmail, token, userName) => {
  emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const templateParams = {
    name: userName,
    link: resetUrl,
    email: userEmail.trim(),
  };

  const serviceID = process.env.EMAILJS_SERVICE_ID;
  const templateID = process.env.EMAILJS_RESET_TEMPLATE_ID; // Nuevo template

  if (!serviceID || !templateID) {
    console.error('Missing EmailJS environment variables for sending password reset email.');
    throw new Error('Missing EmailJS environment variables');
  }

  try {
    const response = await emailjs.send(serviceID, templateID, templateParams);
    console.log(`Correo de restablecimiento de contraseña enviado a: ${userEmail}`);
    return response;
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento con EmailJS:', error);
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};

module.exports = { sendVerificationEmail, sendNewUserForApprovalEmail, sendPasswordResetEmail };
