require('dotenv').config();

console.log('--- Testing .env file loading ---');
console.log('key database',process.env.DATABASE_URL);
console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID);
console.log('EMAILJS_TEMPLATE_ID:', process.env.EMAILJS_TEMPLATE_ID);
console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY);
console.log('EMAILJS_PRIVATE_KEY:', process.env.EMAILJS_PRIVATE_KEY ? '******' : undefined);
console.log('--- Test complete ---');
