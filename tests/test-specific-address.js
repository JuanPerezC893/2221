/**
 * Script para probar la geocodificación de una dirección específica
 * Prueba: "Manuel Montt 367, Santiago, Chile"
 */

const axios = require('axios');

const BACKEND_URL = 'https://3332-lilac.vercel.app/api';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Credenciales que sabemos que funcionan
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testSpecificAddress = async () => {
  console.log('🧪 Probando geocodificación de dirección específica...');
  console.log('📍 Dirección: "Manuel Montt 367, Santiago, Chile"');
  console.log('='.repeat(70));
  console.log('');

  const targetAddress = 'Manuel Montt 367, Santiago, Chile';

  // Paso 1: Probar directamente con Nominatim
  console.log('1️⃣  Probando directamente con Nominatim...');
  
  try {
    const nominatimResponse = await axios.get(NOMINATIM_URL, {
      params: {
        q: targetAddress,
        format: 'json',
        limit: 3,
        countrycodes: 'cl',
        addressdetails: 1,
        dedupe: 1
      },
      headers: {
        'User-Agent': 'GestionResiduos-Test/1.0'
      },
      timeout: 10000
    });

    console.log(`📊 Respuesta de Nominatim (${nominatimResponse.data.length} resultados):`);
    
    if (nominatimResponse.data.length > 0) {
      nominatimResponse.data.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.display_name}`);
        console.log(`      📍 Coordenadas: ${result.lat}, ${result.lon}`);
        console.log(`      🎯 Importancia: ${result.importance || 'N/A'}`);
        console.log(`      🏷️  Tipo: ${result.type || 'N/A'} (${result.class || 'N/A'})`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron resultados en Nominatim');
      
      // Probar variaciones de la dirección
      console.log('');
      console.log('🔄 Probando variaciones de la dirección...');
      
      const variations = [
        'Manuel Montt 367, Santiago',
        'Manuel Montt, Santiago, Chile',
        'Calle Manuel Montt 367, Santiago, Chile',
        'Avenida Manuel Montt 367, Santiago, Chile',
        'Manuel Montt, Providencia, Santiago, Chile'
      ];

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        console.log(`   Probando: "${variation}"`);
        
        try {
          const varResponse = await axios.get(NOMINATIM_URL, {
            params: {
              q: variation,
              format: 'json',
              limit: 1,
              countrycodes: 'cl'
            },
            headers: {
              'User-Agent': 'GestionResiduos-Test/1.0'
            },
            timeout: 5000
          });

          if (varResponse.data.length > 0) {
            const result = varResponse.data[0];
            console.log(`   ✅ ENCONTRADO: ${result.display_name}`);
            console.log(`      📍 Coordenadas: ${result.lat}, ${result.lon}`);
            console.log(`      🎯 Importancia: ${result.importance || 'N/A'}`);
            break;
          } else {
            console.log(`   ❌ No encontrado`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }

        // Esperar un poco entre peticiones para respetar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.log('❌ Error consultando Nominatim:', error.message);
  }

  console.log('');
  console.log('2️⃣  Probando con el backend completo...');

  try {
    // Login primero
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!loginResponse.data.token) {
      console.log('❌ No se pudo obtener token de autenticación');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Autenticación exitosa');

    // Crear proyecto con la dirección problemática
    const projectData = {
      nombre: 'Test Manuel Montt',
      ubicacion: targetAddress,
      fecha_inicio: new Date().toISOString().split('T')[0]
    };

    console.log('📋 Intentando crear proyecto...');

    const createResponse = await axios.post(`${BACKEND_URL}/proyectos`, projectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000, // 45 segundos para geocodificación
      validateStatus: function (status) {
        return status < 600;
      }
    });

    console.log(`📊 Respuesta del backend (Status: ${createResponse.status}):`);
    console.log(JSON.stringify(createResponse.data, null, 2));

    if (createResponse.status === 201) {
      const proyecto = createResponse.data;
      
      console.log('');
      console.log('🎉 ¡PROYECTO CREADO EXITOSAMENTE!');
      
      if (proyecto.latitud && proyecto.longitud) {
        console.log('🌍 GEOCODIFICACIÓN EXITOSA:');
        console.log(`   📍 Coordenadas: ${proyecto.latitud}, ${proyecto.longitud}`);
        
        if (proyecto.geocoding_info) {
          console.log(`   🔍 Estado: ${proyecto.geocoding_info.status}`);
          console.log(`   📋 Dirección normalizada: ${proyecto.geocoding_info.display_name || 'N/A'}`);
          console.log(`   📊 Confianza: ${proyecto.geocoding_info.confidence || 'N/A'}`);
        }

        // Verificar si las coordenadas son de Santiago
        const lat = parseFloat(proyecto.latitud);
        const lon = parseFloat(proyecto.longitud);
        
        if (lat >= -33.7 && lat <= -33.2 && lon >= -70.9 && lon <= -70.4) {
          console.log('✅ Las coordenadas están en el área de Santiago');
        } else {
          console.log('⚠️  Las coordenadas parecen estar fuera del área de Santiago');
        }
      } else {
        console.log('⚠️  Proyecto creado pero sin coordenadas (usará ubicación por defecto en el mapa)');
      }
    } else if (createResponse.status === 500) {
      console.log('');
      console.log('❌ ERROR 500 - Posibles causas:');
      console.log('   • Error en la geocodificación (timeout o error de Nominatim)');
      console.log('   • Error en la base de datos');
      console.log('   • Problema con la migración de coordenadas');
    } else if (createResponse.status === 400) {
      console.log('');
      console.log('❌ ERROR 400 - Error de validación:');
      if (createResponse.data.errors) {
        createResponse.data.errors.forEach(error => {
          console.log(`   • ${error.msg} (campo: ${error.param})`);
        });
      }
    }

  } catch (backendError) {
    console.log('❌ Error con el backend:', backendError.message);
    if (backendError.response) {
      console.log(`   Status: ${backendError.response.status}`);
      console.log(`   Data:`, JSON.stringify(backendError.response.data, null, 2));
    }
  }

  console.log('');
  console.log('💡 RECOMENDACIONES:');
  console.log('='.repeat(70));
  console.log('1️⃣  Si Nominatim no encuentra la dirección exacta, prueba con:');
  console.log('   • "Manuel Montt, Providencia, Santiago"');
  console.log('   • "Avenida Manuel Montt, Santiago"');
  console.log('   • "Manuel Montt, Santiago Centro"');
  console.log('');
  console.log('2️⃣  Direcciones que funcionan bien en Santiago:');
  console.log('   • "Providencia, Santiago"');
  console.log('   • "Las Condes, Santiago"');
  console.log('   • "Santiago Centro, Chile"');
  console.log('   • "Plaza de Armas, Santiago"');
  console.log('');
  console.log('3️⃣  Para direcciones muy específicas, es mejor usar:');
  console.log('   • Comuna + Ciudad: "Providencia, Santiago"');
  console.log('   • En lugar de dirección exacta + número');
};

if (require.main === module) {
  testSpecificAddress();
}

module.exports = { testSpecificAddress };
