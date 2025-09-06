#!/usr/bin/env node
// Script para probar las conversiones de unidades en el backend

const https = require('https');

const BACKEND_URL = 'https://3332-lilac.vercel.app';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method.toUpperCase() !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method.toUpperCase() !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testUnitConversions() {
  log(`${colors.bold}🔄 PRUEBA DE CONVERSIONES DE UNIDADES${colors.reset}`, colors.blue);
  log(`${colors.bold}Backend: ${BACKEND_URL}${colors.reset}`, colors.cyan);
  log('=' .repeat(70), colors.blue);

  console.log();
  log('📝 Vamos a probar diferentes conversiones de unidades:', colors.blue);
  
  const testCases = [
    { cantidad: 1, unidad: 'toneladas', expectedKg: 1000, description: '1 tonelada → 1000 kg' },
    { cantidad: 2.5, unidad: 'toneladas', expectedKg: 2500, description: '2.5 toneladas → 2500 kg' },
    { cantidad: 1000, unidad: 'g', expectedKg: 1, description: '1000 gramos → 1 kg' },
    { cantidad: 500, unidad: 'g', expectedKg: 0.5, description: '500 gramos → 0.5 kg' },
    { cantidad: 10, unidad: 'kg', expectedKg: 10, description: '10 kg → 10 kg (sin conversión)' },
    { cantidad: 1, unidad: 'ton', expectedKg: 1000, description: '1 ton → 1000 kg' },
    { cantidad: 2, unidad: 't', expectedKg: 2000, description: '2 t → 2000 kg' },
    { cantidad: 1, unidad: 'lb', expectedKg: 0.453592, description: '1 libra → ~0.45 kg' }
  ];

  // Primero necesitamos hacer login
  log(`🔐 Primero necesitamos hacer login...`, colors.yellow);
  
  const loginData = {
    email: 'terminal@test.com',
    password: 'TestPass123!'
  };

  try {
    const loginResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', loginData);
    
    if (loginResponse.status !== 200) {
      log(`❌ No se pudo hacer login. Status: ${loginResponse.status}`, colors.red);
      log(`Respuesta: ${loginResponse.data}`, colors.red);
      log(`\n💡 Necesitas un usuario válido para probar las conversiones.`, colors.yellow);
      log(`Usa el frontend para crear un usuario primero.`, colors.yellow);
      return;
    }

    const loginResult = JSON.parse(loginResponse.data);
    const token = loginResult.token;
    log(`✅ Login exitoso`, colors.green);

    // Ahora probamos las conversiones (esto requeriría crear un residuo, lo cual necesita un proyecto)
    log(`\n⚠️ Para probar completamente las conversiones, necesitaríamos:`, colors.yellow);
    log(`1. Un proyecto existente`, colors.cyan);
    log(`2. Permisos para crear residuos`, colors.cyan);
    log(`\n📝 Por ahora, las conversiones están implementadas en el código:`, colors.blue);
    
    testCases.forEach(testCase => {
      log(`   • ${testCase.description}`, colors.cyan);
    });

    log(`\n🎯 Para probar completamente:`, colors.green);
    log(`1. Ve al frontend (http://localhost:5174)`, colors.cyan);
    log(`2. Crea un proyecto`, colors.cyan);
    log(`3. Agrega residuos con diferentes unidades`, colors.cyan);
    log(`4. Observa las conversiones automáticas`, colors.cyan);

  } catch (error) {
    log(`❌ Error durante la prueba: ${error.message}`, colors.red);
  }
}

// Función para mostrar la tabla de conversiones implementadas
function showConversionTable() {
  console.log();
  log(`${colors.bold}📊 TABLA DE CONVERSIONES IMPLEMENTADAS${colors.reset}`, colors.blue);
  log('=' .repeat(50), colors.blue);
  
  const conversiones = [
    ['Unidad', 'Factor', 'Ejemplo'],
    ['kg, kilogramos', '1', '5 kg → 5 kg'],
    ['toneladas', '1000', '1.5 toneladas → 1500 kg'],
    ['ton', '1000', '2 ton → 2000 kg'],
    ['t', '1000', '0.5 t → 500 kg'],
    ['g, gramos', '0.001', '2000 g → 2 kg'],
    ['lb, libras', '0.453592', '10 lb → 4.54 kg']
  ];

  conversiones.forEach((row, index) => {
    if (index === 0) {
      log(`${colors.bold}${row[0].padEnd(15)} ${row[1].padEnd(10)} ${row[2]}${colors.reset}`, colors.cyan);
      log('-'.repeat(50), colors.blue);
    } else {
      log(`${row[0].padEnd(15)} ${row[1].padEnd(10)} ${row[2]}`, colors.reset);
    }
  });
}

if (require.main === module) {
  showConversionTable();
  testUnitConversions().catch(console.error);
}
