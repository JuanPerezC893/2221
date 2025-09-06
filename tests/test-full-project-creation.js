/**
 * Script completo para probar la creación de proyectos con autenticación
 * Simula exactamente lo que hace el frontend
 */

const axios = require('axios');

const BACKEND_URL = 'https://3332-lilac.vercel.app/api';

// Datos de usuario de prueba - ajusta según tu base de datos
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testFullProjectCreation = async () => {
  console.log('🧪 Probando creación de proyecto completa con autenticación...');
  console.log('='.repeat(70));
  console.log('');

  let token = null;

  try {
    // Paso 1: Intentar autenticarse
    console.log('1️⃣  Intentando autenticación...');
    console.log(`   Email: ${TEST_USER.email}`);
    
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      }, {
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('✅ Autenticación exitosa');
        console.log(`   Token: ${token.substring(0, 20)}...`);
      } else {
        console.log('❌ Autenticación fallida:', loginResponse.status, loginResponse.data);
        console.log('');
        console.log('💡 SOLUCIONES:');
        console.log('   1. Regístrate primero desde el frontend');
        console.log('   2. O verifica las credenciales en TEST_USER');
        console.log('   3. O usa las credenciales de un usuario existente');
        return;
      }
    } catch (error) {
      console.log('❌ Error en autenticación:', error.response?.data || error.message);
      
      // Intentar registro si el login falla
      console.log('');
      console.log('🔄 Intentando registro automático...');
      try {
        const registerData = {
          nombre: 'Usuario Test',
          email: TEST_USER.email,
          password: TEST_USER.password,
          empresa_rut: '12345678-9',
          razon_social: 'Empresa Test Geocodificación'
        };

        const registerResponse = await axios.post(`${BACKEND_URL}/auth/register`, registerData, {
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        console.log('📊 Respuesta de registro:');
        console.log(`   Status: ${registerResponse.status}`);
        console.log(`   Data:`, JSON.stringify(registerResponse.data, null, 2));

        if (registerResponse.status === 201) {
          console.log('✅ Registro exitoso, intentando login nuevamente...');
          
          const secondLoginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
          });

          if (secondLoginResponse.data.token) {
            token = secondLoginResponse.data.token;
            console.log('✅ Login exitoso después del registro');
          }
        }
      } catch (registerError) {
        console.log('❌ Error en registro:', registerError.response?.data || registerError.message);
        return;
      }
    }

    if (!token) {
      console.log('❌ No se pudo obtener token de autenticación');
      return;
    }

    console.log('');

    // Paso 2: Crear proyecto con autenticación
    console.log('2️⃣  Creando proyecto con token de autenticación...');
    
    const projectData = {
      nombre: 'Test Geocodificación Automática',
      ubicacion: 'Valparaíso, Chile',
      fecha_inicio: new Date().toISOString().split('T')[0]
    };

    console.log('📋 Datos del proyecto:');
    console.log(JSON.stringify(projectData, null, 2));
    console.log('');

    try {
      const createResponse = await axios.post(`${BACKEND_URL}/proyectos`, projectData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 30 segundos para geocodificación
        validateStatus: function (status) {
          return status < 600;
        }
      });

      console.log('📊 Respuesta de creación de proyecto:');
      console.log(`   Status: ${createResponse.status}`);
      console.log(`   Headers:`, JSON.stringify(createResponse.headers, null, 2));
      console.log(`   Data:`, JSON.stringify(createResponse.data, null, 2));

      if (createResponse.status === 201) {
        console.log('');
        console.log('🎉 ¡PROYECTO CREADO EXITOSAMENTE!');
        
        const proyecto = createResponse.data;
        if (proyecto.latitud && proyecto.longitud) {
          console.log('🌍 GEOCODIFICACIÓN EXITOSA:');
          console.log(`   📍 Coordenadas: ${proyecto.latitud}, ${proyecto.longitud}`);
          
          if (proyecto.geocoding_info) {
            console.log(`   🔍 Estado: ${proyecto.geocoding_info.status}`);
            console.log(`   📋 Dirección normalizada: ${proyecto.geocoding_info.display_name || 'N/A'}`);
          }
        } else {
          console.log('⚠️  Proyecto creado pero sin coordenadas');
        }
      } else {
        console.log('❌ Error creando proyecto:');
        console.log(`   Mensaje: ${createResponse.data?.message || 'Error desconocido'}`);
        if (createResponse.data?.errors) {
          console.log('   Errores de validación:');
          createResponse.data.errors.forEach((error, index) => {
            console.log(`     ${index + 1}. ${error.msg} (campo: ${error.param})`);
          });
        }
      }

    } catch (createError) {
      console.log('❌ Error en la petición de creación:');
      console.log(`   Mensaje: ${createError.message}`);
      
      if (createError.response) {
        console.log(`   Status: ${createError.response.status}`);
        console.log(`   Data:`, JSON.stringify(createError.response.data, null, 2));
        
        // Analizar errores específicos
        if (createError.response.status === 500) {
          console.log('');
          console.log('🔍 ERROR 500 - ANÁLISIS:');
          console.log('   • Posible error en la geocodificación (Nominatim)');
          console.log('   • Error en la base de datos (faltan columnas latitud/longitud)');
          console.log('   • Error en el servicio de geocodificación');
          console.log('   • Timeout en la petición a Nominatim');
        } else if (createError.response.status === 400) {
          console.log('');
          console.log('🔍 ERROR 400 - VALIDACIÓN:');
          if (createError.response.data.errors) {
            createError.response.data.errors.forEach(error => {
              console.log(`   • ${error.msg} (campo: ${error.param})`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }

  console.log('');
  console.log('📋 PRÓXIMOS PASOS PARA DEBUGGEAR:');
  console.log('='.repeat(70));
  console.log('1️⃣  Ve al dashboard de Vercel');
  console.log('2️⃣  Proyecto backend → Functions → Logs');
  console.log('3️⃣  Busca logs de cuando ejecutes este script');
  console.log('4️⃣  Mira si hay errores de geocodificación o base de datos');
  console.log('');
  console.log('🔧 SI HAY ERROR DE GEOCODIFICACIÓN:');
  console.log('   • Verifica que axios esté en dependencies (no devDependencies)');
  console.log('   • Revisa que Nominatim esté respondiendo');
  console.log('   • Aumenta el timeout si es necesario');
  console.log('');
  console.log('🗃️  SI HAY ERROR DE BASE DE DATOS:');
  console.log('   • Ejecuta la migración SQL para agregar columnas latitud/longitud');
  console.log('   • Verifica la conexión a Neon Postgres');
};

if (require.main === module) {
  testFullProjectCreation();
}

module.exports = { testFullProjectCreation };
