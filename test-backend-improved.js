#!/usr/bin/env node
// Script mejorado para verificar el estado del backend desplegado en Vercel

const https = require('https');
const http = require('http');

// Configuración
const BACKEND_URL = 'https://3332-lilac.vercel.app';
const TIMEOUT = 10000; // 10 segundos

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
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Backend-Health-Check/2.0',
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method.toUpperCase() !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          url: url,
          method: method
        });
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message, url: url, method: method });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ error: 'Request timeout', url: url, method: method });
    });

    req.setTimeout(TIMEOUT);

    if (data && method.toUpperCase() !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, expectedStatus = 200, method = 'GET', data = null) {
  const url = `${BACKEND_URL}${path}`;
  log(`🔄 Probando ${name}: ${method} ${path}`, colors.blue);
  
  try {
    const result = await makeRequest(url, method, data);
    
    if (result.status === expectedStatus) {
      log(`✅ ${name}: OK (${result.status})`, colors.green);
      if (result.data) {
        let displayData = result.data;
        try {
          // Si es JSON, parsearlo para mejor display
          const parsed = JSON.parse(result.data);
          displayData = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // No es JSON válido, mantener como texto
        }
        log(`   Respuesta: ${displayData.substring(0, 200)}${displayData.length > 200 ? '...' : ''}`, colors.cyan);
      }
      return true;
    } else {
      log(`⚠️  ${name}: Status inesperado ${result.status} (esperado: ${expectedStatus})`, colors.yellow);
      if (result.data) {
        let displayData = result.data;
        try {
          const parsed = JSON.parse(result.data);
          displayData = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // No es JSON válido, mantener como texto
        }
        log(`   Respuesta: ${displayData.substring(0, 300)}`, colors.cyan);
      }
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Error - ${error.error}`, colors.red);
    return false;
  }
}

async function testHealthCheck() {
  log(`${colors.bold}🏥 VERIFICACIÓN COMPLETA DEL BACKEND${colors.reset}`, colors.blue);
  log(`${colors.bold}URL: ${BACKEND_URL}${colors.reset}`, colors.cyan);
  log('=' .repeat(70), colors.blue);
  
  const tests = [
    // Test básico - endpoint raíz
    { name: 'Endpoint Raíz', path: '/', method: 'GET', expectedStatus: 200 },
    
    // Test endpoints GET (para verificar que existen)
    { name: 'Auth Login (GET)', path: '/api/auth/login', method: 'GET', expectedStatus: 404 },
    { name: 'Auth Register (GET)', path: '/api/auth/register', method: 'GET', expectedStatus: 404 },
    { name: 'Trazabilidad (GET)', path: '/api/trazabilidad', method: 'GET', expectedStatus: 401 },
    
    // Test endpoints POST con datos vacíos (para verificar validación)
    { 
      name: 'Auth Login (POST sin datos)', 
      path: '/api/auth/login', 
      method: 'POST', 
      expectedStatus: 400,
      data: {}
    },
    { 
      name: 'Auth Register (POST sin datos)', 
      path: '/api/auth/register', 
      method: 'POST', 
      expectedStatus: 400,
      data: {}
    },
    { 
      name: 'Trazabilidad (POST sin datos)', 
      path: '/api/trazabilidad', 
      method: 'POST', 
      expectedStatus: 401,
      data: {}
    },
    
    // Test endpoints protegidos
    { name: 'Proyectos', path: '/api/proyectos', method: 'GET', expectedStatus: 401 },
    { name: 'Residuos', path: '/api/residuos', method: 'GET', expectedStatus: 401 },
    { name: 'Users', path: '/api/users', method: 'GET', expectedStatus: 401 },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(
      test.name, 
      test.path, 
      test.expectedStatus, 
      test.method, 
      test.data
    );
    if (result) passed++;
    console.log(); // Línea en blanco entre tests
  }

  // Resumen
  log('=' .repeat(70), colors.blue);
  log(`${colors.bold}📊 RESUMEN DE RESULTADOS${colors.reset}`, colors.blue);
  log(`Total de pruebas: ${total}`, colors.cyan);
  log(`Exitosas: ${passed}`, passed === total ? colors.green : colors.yellow);
  log(`Fallidas: ${total - passed}`, total - passed === 0 ? colors.green : colors.red);
  log(`Porcentaje de éxito: ${Math.round((passed / total) * 100)}%`, colors.cyan);
  
  if (passed === total) {
    log(`\\n🎉 ¡Todas las pruebas pasaron! El backend está funcionando perfectamente.`, colors.green);
  } else if (passed >= total * 0.8) {
    log(`\\n✅ El backend está funcionando bien (${Math.round((passed / total) * 100)}% éxito).`, colors.green);
  } else if (passed >= total * 0.6) {
    log(`\\n⚠️  El backend está funcionando parcialmente (${Math.round((passed / total) * 100)}% éxito).`, colors.yellow);
    log(`🔧 Algunos endpoints pueden necesitar atención.`, colors.yellow);
  } else {
    log(`\\n❌ El backend tiene problemas significativos (${Math.round((passed / total) * 100)}% éxito).`, colors.red);
    log(`🚨 Revisa los logs de Vercel y la configuración.`, colors.red);
  }

  // Información adicional
  log(`\\n${colors.bold}💡 INTERPRETACIÓN DE RESULTADOS:${colors.reset}`, colors.blue);
  log(`• 200: Endpoint funcionando correctamente`, colors.cyan);
  log(`• 400: Validación funciona (error esperado con datos vacíos/inválidos)`, colors.cyan);
  log(`• 401: Autenticación funciona (error esperado sin token)`, colors.cyan);
  log(`• 404: Endpoint no existe o ruta incorrecta`, colors.cyan);
  log(`• 500: Error interno del servidor`, colors.cyan);
}

// Función para probar flujo completo de autenticación
async function testAuthFlow() {
  log(`\\n${colors.bold}🔐 PRUEBA DE FLUJO DE AUTENTICACIÓN${colors.reset}`, colors.blue);
  log('=' .repeat(70), colors.blue);
  
  // Intentar login con datos de prueba
  log(`🔄 Probando login con datos de prueba...`, colors.blue);
  
  try {
    const loginData = {
      email: 'test@test.com',
      password: 'testpassword123'
    };
    
    const result = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', loginData);
    
    if (result.status === 401) {
      log(`✅ Endpoint de login funciona correctamente (usuario no existe)`, colors.green);
      log(`   Esto es esperado - el endpoint funciona pero el usuario no existe`, colors.cyan);
    } else if (result.status === 400) {
      log(`✅ Validación de login funciona correctamente`, colors.green);
      log(`   Respuesta: ${result.data}`, colors.cyan);
    } else if (result.status === 200) {
      log(`🎉 ¡Login exitoso! (usuario de prueba existe)`, colors.green);
      log(`   Respuesta: ${result.data}`, colors.cyan);
    } else {
      log(`⚠️  Respuesta inesperada del login: ${result.status}`, colors.yellow);
      log(`   Respuesta: ${result.data}`, colors.cyan);
    }
  } catch (error) {
    log(`❌ Error en flujo de login: ${error.error}`, colors.red);
  }
}

// Ejecutar las pruebas
async function main() {
  console.clear();
  log(`${colors.bold}🚀 INICIANDO VERIFICACIÓN COMPLETA DEL BACKEND...${colors.reset}\\n`, colors.green);
  
  await testHealthCheck();
  await testAuthFlow();
  
  log(`\\n${colors.bold}🏁 VERIFICACIÓN COMPLETADA${colors.reset}`, colors.blue);
  log(`${colors.bold}📝 Si necesitas más detalles, revisa los logs de Vercel en tu dashboard.${colors.reset}`, colors.cyan);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHealthCheck, makeRequest };
