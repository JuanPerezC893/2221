require('dotenv').config();
const { sendVerificationEmail } = require('./services/emailService');

const checkEmailJS = async () => {
  console.log('Attempting to send a test email using the project\'s sendVerificationEmail function...');

  console.log('Reading environment variables:');
  console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID);
  console.log('EMAILJS_TEMPLATE_ID:', process.env.EMAILJS_TEMPLATE_ID);
  console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY);
  console.log('EMAILJS_PRIVATE_KEY:', process.env.EMAILJS_PRIVATE_KEY ? '******' : undefined);
  console.log('BACKEND_URL:', process.env.BACKEND_URL);


  if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.BACKEND_URL) {
    console.error('Error: Missing one or more required environment variables.');
    console.log('Please check your .env file for EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, and BACKEND_URL.');
    return;
  }

  console.log('All environment variables seem to be present.');

  try {
    // We use a dummy token for the test, and the email from your example
    const response = await sendVerificationEmail('jusepecaz@gmail.com', 'dummy-token-for-test');
    console.log('SUCCESS!', response.status, response.text);
    console.log('Your EmailJS configuration and the emailService.js function are working correctly.');
  } catch (err) {
    console.error('FAILED...', err);
    console.log('There seems to be an issue. Please double-check your credentials in the .env file.');
  }
};

checkEmailJS();