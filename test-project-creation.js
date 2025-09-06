/**
 * Script para testear la creación de proyectos en el backend de Vercel
 * Ayuda a debuggear errores de validación
 */

const axios = require('axios');

const BACKEND_URL = 'https://3332-lilac.vercel.app/api';

const testProjectCreation = async () => {
  console.log('🧪 Testeando creación de proyectos en backend...');
  console.log('🌐 Backend URL:', BACKEND_URL);
  console.log('='.repeat(60));
  console.log('');
  
  // Datos de prueba para crear un proyecto
  const projectData = {
    nombre: 'Proyecto Test Geocodificación',
    ubicacion: 'Santiago, Chile',
    fecha_inicio: new Date().toISOString().split('T')[0] // Fecha de hoy en formato YYYY-MM-DD
  };
  
  console.log('📋 Datos del proyecto de prueba:');
  console.log(JSON.stringify(projectData, null, 2));
  console.log('');
  
  try {
    // Test sin autenticación para ver el error específico
    console.log('1️⃣  Intentando crear proyecto SIN autenticación...');
    try {
      const response = await axios.post(`${BACKEND_URL}/proyectos`, projectData, {
        timeout: 15000,
        validateStatus: function (status) {
          return status < 600; // Aceptar todos los códigos de respuesta
        }
      });
      
      console.log('📊 Respuesta del servidor:');
      console.log('   Status:', response.status);
      console.log('   Headers:', JSON.stringify(response.headers, null, 2));
      console.log('   Data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Error en la petición:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        console.log('   Headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.log('   No se recibió respuesta del servidor');
        console.log('   Request:', error.request);
      } else {
        console.log('   Error configurando request:', error.message);
      }
    }
    
    console.log('');
    console.log('2️⃣  Verificando validaciones del backend...');
    
    // Test con datos incompletos para ver validaciones
    const invalidData = {
      nombre: '', // Vacío - debería fallar
      ubicacion: 'Santiago, Chile',
      fecha_inicio: 'invalid-date' // Fecha inválida
    };
    
    console.log('📋 Datos inválidos para probar validaciones:');
    console.log(JSON.stringify(invalidData, null, 2));
    
    try {
      const validationResponse = await axios.post(`${BACKEND_URL}/proyectos`, invalidData, {
        timeout: 15000,
        validateStatus: function (status) {
          return status < 600;
        }
      });
      
      console.log('📊 Respuesta con datos inválidos:');
      console.log('   Status:', validationResponse.status);
      console.log('   Data:', JSON.stringify(validationResponse.data, null, 2));
      
    } catch (error) {
      console.log('📊 Error de validación (esperado):');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('');
    console.log('3️⃣  Verificando ruta de login...');
    
    // Test de login para obtener token (opcional)
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/users/login`, {
        email: 'test@example.com',
        password: 'invalid'
      }, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 600;
        }
      });
      
      console.log('📊 Respuesta de login:');
      console.log('   Status:', loginResponse.status);
      console.log('   Data:', JSON.stringify(loginResponse.data, null, 2));
      
    } catch (error) {
      console.log('📊 Respuesta de login (esperado fallo):');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error general durante las pruebas:', error.message);
  }
  
  console.log('');
  console.log('📋 ANÁLISIS DEL ERROR:');
  console.log('='.repeat(60));
  console.log('');
  console.log('El error "Object { errors: (1) […] }" sugiere que:');
  console.log('');
  console.log('1️⃣  Hay un error de validación en el backend');
  console.log('2️⃣  Probablemente un campo requerido está faltando o es inválido');
  console.log('3️⃣  El formato de fecha podría estar causando problemas');
  console.log('4️⃣  La validación de empresa_rut podría estar fallando');
  console.log('');
  console.log('🔧 POSIBLES SOLUCIONES:');
  console.log('   • Verificar que fecha_inicio esté en formato ISO8601');
  console.log('   • Asegurarse de que el token JWT sea válido');
  console.log('   • Revisar que empresa_rut esté en el token');
  console.log('   • Verificar logs de Vercel para más detalles');
  console.log('');
  console.log('📱 Para ver logs detallados:');
  console.log('   1. Ve al dashboard de Vercel');
  console.log('   2. Proyecto backend → Functions');
  console.log('   3. Mira los logs en tiempo real');
  console.log('   4. Intenta crear un proyecto desde el frontend');
};

if (require.main === module) {
  testProjectCreation();
}

module.exports = { testProjectCreation };
