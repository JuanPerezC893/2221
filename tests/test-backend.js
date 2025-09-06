#!/usr/bin/env node
// Script para verificar el estado del backend desplegado en Vercel

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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Backend-Health-Check/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message, url: url });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ error: 'Request timeout', url: url });
    });

    req.setTimeout(TIMEOUT);
    req.end();
  });
}

async function testEndpoint(name, path, expectedStatus = 200) {
  const url = `${BACKEND_URL}${path}`;
  log(`🔄 Probando ${name}: ${path}`, colors.blue);
  
  try {
    const result = await makeRequest(url);
    
    if (result.status === expectedStatus) {
      log(`✅ ${name}: OK (${result.status})`, colors.green);
      if (result.data) {
        log(`   Respuesta: ${result.data.substring(0, 100)}${result.data.length > 100 ? '...' : ''}`, colors.cyan);
      }
      return true;
    } else {
      log(`⚠️  ${name}: Status inesperado ${result.status} (esperado: ${expectedStatus})`, colors.yellow);
      if (result.data) {
        log(`   Respuesta: ${result.data.substring(0, 200)}`, colors.cyan);
      }
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Error - ${error.error}`, colors.red);
    return false;
  }
}

async function testHealthCheck() {
  log(`${colors.bold}🏥 VERIFICACIÓN DE SALUD DEL BACKEND${colors.reset}`, colors.blue);
  log(`${colors.bold}URL: ${BACKEND_URL}${colors.reset}`, colors.cyan);
  log('=' .repeat(60), colors.blue);
  
  const tests = [
    // Test básico - endpoint raíz
    { name: 'Endpoint Raíz', path: '/', expectedStatus: 200 },
    
    // Test endpoints de la API
    { name: 'Auth - Login', path: '/api/auth/login', expectedStatus: 400 }, // Esperamos 400 sin datos
    { name: 'Auth - Register', path: '/api/auth/register', expectedStatus: 400 }, // Esperamos 400 sin datos
    { name: 'Proyectos', path: '/api/proyectos', expectedStatus: 401 }, // Esperamos 401 sin token
    { name: 'Residuos', path: '/api/residuos', expectedStatus: 401 }, // Esperamos 401 sin token
    { name: 'Users', path: '/api/users', expectedStatus: 401 }, // Esperamos 401 sin token
    { name: 'Trazabilidad', path: '/api/trazabilidad', expectedStatus: 401 }, // Esperamos 401 sin token
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, test.expectedStatus);
    if (result) passed++;
    console.log(); // Línea en blanco entre tests
  }

  // Resumen
  log('=' .repeat(60), colors.blue);
  log(`${colors.bold}📊 RESUMEN DE RESULTADOS${colors.reset}`, colors.blue);
  log(`Total de pruebas: ${total}`, colors.cyan);
  log(`Exitosas: ${passed}`, passed === total ? colors.green : colors.yellow);
  log(`Fallidas: ${total - passed}`, total - passed === 0 ? colors.green : colors.red);
  
  if (passed === total) {
    log(`\n🎉 ¡Todas las pruebas pasaron! El backend está funcionando correctamente.`, colors.green);
    log(`✅ El backend en ${BACKEND_URL} está operativo.`, colors.green);
  } else if (passed > total / 2) {
    log(`\n⚠️  La mayoría de pruebas pasaron, pero hay algunos problemas.`, colors.yellow);
    log(`🔧 El backend está parcialmente operativo.`, colors.yellow);
  } else {
    log(`\n❌ Múltiples pruebas fallaron. El backend puede tener problemas serios.`, colors.red);
    log(`🚨 Revisa los logs de Vercel y la configuración.`, colors.red);
  }

  // Información adicional
  log(`\n${colors.bold}💡 INFORMACIÓN ADICIONAL:${colors.reset}`, colors.blue);
  log(`• Si ves errores 401, es normal - significa que la autenticación funciona`, colors.cyan);
  log(`• Si ves errores 400, es normal - significa que las validaciones funcionan`, colors.cyan);
  log(`• Si ves errores 500, revisa los logs de Vercel`, colors.cyan);
  log(`• Si ves timeouts, puede ser un problema de conexión o configuración`, colors.cyan);
}

// Función para probar con datos reales (opcional)
async function testWithSampleData() {
  log(`\n${colors.bold}🧪 PRUEBA CON DATOS DE MUESTRA${colors.reset}`, colors.blue);
  log('=' .repeat(60), colors.blue);
  
  // Test de registro (esperamos error de validación, lo que significa que el endpoint funciona)
  const registerUrl = `${BACKEND_URL}/api/auth/register`;
  log(`🔄 Probando registro con datos vacíos...`, colors.blue);
  
  try {
    const result = await makeRequest(registerUrl);
    if (result.status === 400) {
      log(`✅ Endpoint de registro funciona correctamente (validación activa)`, colors.green);
    } else {
      log(`⚠️  Respuesta inesperada del registro: ${result.status}`, colors.yellow);
    }
  } catch (error) {
    log(`❌ Error en endpoint de registro: ${error.error}`, colors.red);
  }
}

// Ejecutar las pruebas
async function main() {
  console.clear();
  log(`${colors.bold}🚀 INICIANDO VERIFICACIÓN DEL BACKEND...${colors.reset}\n`, colors.green);
  
  await testHealthCheck();
  await testWithSampleData();
  
  log(`\n${colors.bold}🏁 VERIFICACIÓN COMPLETADA${colors.reset}`, colors.blue);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHealthCheck, makeRequest };
