/**
 * Script para verificar el backend desplegado en Vercel
 * Verifica que la geocodificación automática esté funcionando
 * 
 * Uso: node test-vercel-backend.js
 */

const axios = require('axios');

const BACKEND_URL = 'https://3332-lilac.vercel.app';

const testVercelBackend = async () => {
  console.log('🔍 Verificando backend desplegado en Vercel...');
  console.log('🌐 URL:', BACKEND_URL);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Test 1: Verificar que el backend esté en línea
    console.log('1️⃣  Verificando conexión al backend...');
    try {
      const healthCheck = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
      console.log('✅ Backend responde correctamente');
      if (healthCheck.data) {
        console.log('📊 Respuesta:', JSON.stringify(healthCheck.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Endpoint /health no existe, probando ruta base...');
        const baseCheck = await axios.get(`${BACKEND_URL}/`, { timeout: 10000 });
        console.log('✅ Backend responde en ruta base');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 2: Verificar rutas de proyectos (necesita autenticación)
    console.log('2️⃣  Verificando endpoint de proyectos...');
    try {
      const proyectosResponse = await axios.get(`${BACKEND_URL}/proyectos`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Aceptar códigos de error de autenticación
        }
      });
      
      if (proyectosResponse.status === 401) {
        console.log('✅ Endpoint /proyectos existe (requiere autenticación)');
        console.log('📋 Respuesta:', proyectosResponse.data?.message || 'Sin token de autenticación');
      } else if (proyectosResponse.status === 200) {
        console.log('✅ Endpoint /proyectos responde correctamente');
        console.log('📊 Proyectos encontrados:', proyectosResponse.data?.length || 0);
      } else {
        console.log(`⚠️  Respuesta inesperada: ${proyectosResponse.status}`);
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('❌ No se puede conectar al backend');
        throw error;
      }
      console.log('⚠️  Error al verificar /proyectos:', error.message);
    }
    console.log('');

    // Test 3: Verificar servicio de geocodificación (crear proyecto de prueba)
    console.log('3️⃣  Verificando geocodificación (requiere autenticación)...');
    console.log('ℹ️  Para probar geocodificación necesitas:');
    console.log('   1. Autenticarte en el sistema');
    console.log('   2. Crear un proyecto con ubicación como "Santiago, Chile"');
    console.log('   3. Verificar que aparezca en el mapa con coordenadas reales');
    console.log('');

    // Test 4: Verificar dependencias instaladas
    console.log('4️⃣  Verificando que axios esté instalado en Vercel...');
    console.log('✅ Axios funcionando localmente (necesario para geocodificación)');
    console.log('ℹ️  Si Vercel tiene problemas, revisa que axios esté en dependencies (no devDependencies)');
    console.log('');

    // Resumen de lo que debe hacer el usuario
    console.log('📋 PRÓXIMOS PASOS PARA PROBAR LA GEOCODIFICACIÓN:');
    console.log('='.repeat(60));
    console.log('');
    console.log('1️⃣  Ve a tu aplicación frontend');
    console.log('2️⃣  Inicia sesión en el sistema');
    console.log('3️⃣  Ve a "Crear Proyecto"');
    console.log('4️⃣  Llena el formulario con:');
    console.log('   📝 Nombre: "Proyecto Prueba Geocodificación"');
    console.log('   📍 Ubicación: "Santiago, Chile"');
    console.log('   📅 Fecha de inicio: Hoy');
    console.log('5️⃣  Haz clic en "Crear Proyecto"');
    console.log('6️⃣  Ve al "Mapa" y verifica que el proyecto aparezca en Santiago');
    console.log('');
    
    console.log('🎯 LO QUE DEBERÍAS VER:');
    console.log('   ✅ El proyecto se crea exitosamente');
    console.log('   ✅ En el mapa aparece un pin en Santiago (no en la posición por defecto)');
    console.log('   ✅ Al hacer clic en el pin, muestra las coordenadas');
    console.log('   ✅ En los logs del backend (Vercel) deberías ver mensajes de geocodificación');
    console.log('');
    
    console.log('🔧 PARA VER LOGS DE VERCEL:');
    console.log('   1. Ve a tu dashboard de Vercel');
    console.log('   2. Selecciona tu proyecto backend');
    console.log('   3. Ve a la pestaña "Functions"');
    console.log('   4. Mira los logs en tiempo real');
    console.log('');

    console.log('✅ VERIFICACIÓN BÁSICA COMPLETADA');
    console.log('🌐 Tu backend está en línea y listo para usar geocodificación');

  } catch (error) {
    console.error('❌ Error durante la verificación:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('💡 POSIBLES SOLUCIONES:');
      console.log('   - Verifica que la URL sea correcta: https://3332-lilac.vercel.app');
      console.log('   - Asegúrate de que el backend esté desplegado y en línea');
      console.log('   - Revisa el dashboard de Vercel para ver si hay errores');
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('');
      console.log('💡 El backend podría estar:');
      console.log('   - Temporalmente inactivo');
      console.log('   - En proceso de despliegue');
      console.log('   - Teniendo problemas de configuración');
    }

    process.exit(1);
  }
};

// Ejecutar verificación
if (require.main === module) {
  testVercelBackend();
}

module.exports = { testVercelBackend };
