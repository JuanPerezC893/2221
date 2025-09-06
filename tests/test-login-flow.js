#!/usr/bin/env node
// Script para probar el flujo completo de login del frontend contra el backend

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

async function testLoginFlow() {
  log(`${colors.bold}🧪 PRUEBA DE FLUJO COMPLETO DE LOGIN${colors.reset}`, colors.blue);
  log(`${colors.bold}Backend: ${BACKEND_URL}${colors.reset}`, colors.cyan);
  log('=' .repeat(70), colors.blue);

  console.log();
  log('📝 Vamos a simular el flujo exacto que hace tu frontend:', colors.blue);
  log('   1. POST /api/auth/login con credenciales de prueba', colors.cyan);
  log('   2. Analizar la respuesta del token', colors.cyan);
  log('   3. Decodificar el JWT', colors.cyan);
  log('   4. Verificar endpoints protegidos con el token', colors.cyan);
  console.log();

  // Datos de prueba - puedes cambiar estos
  const testCredentials = {
    email: 'test@test.com',
    password: 'testpass123'
  };

  log(`🔐 Intentando login con credenciales de prueba:`, colors.blue);
  log(`   Email: ${testCredentials.email}`, colors.cyan);
  log(`   Password: ${testCredentials.password}`, colors.cyan);
  console.log();

  try {
    // Paso 1: Login
    log(`📤 Enviando POST /api/auth/login...`, colors.yellow);
    const loginResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', testCredentials);
    
    log(`📥 Respuesta del login:`, colors.yellow);
    log(`   Status: ${loginResponse.status}`, colors.cyan);
    
    if (loginResponse.status === 200) {
      // Login exitoso
      log(`✅ ¡Login exitoso!`, colors.green);
      const loginData = JSON.parse(loginResponse.data);
      const token = loginData.token;
      
      log(`   Token recibido: ${token.substring(0, 50)}...`, colors.cyan);
      
      // Decodificar token (sin verificar firma, solo para debug)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        log(`   Datos del token:`, colors.cyan);
        log(`     - User ID: ${decoded.id}`, colors.cyan);
        log(`     - Rol: ${decoded.rol}`, colors.cyan);
        log(`     - Empresa: ${decoded.empresa_rut}`, colors.cyan);
        log(`     - Expira: ${new Date(decoded.exp * 1000).toLocaleString()}`, colors.cyan);
        
        // Verificar si el token está expirado
        const now = Math.floor(Date.now() / 1000);
        const isExpired = decoded.exp < now;
        log(`     - ¿Expirado?: ${isExpired ? '❌ SÍ' : '✅ NO'}`, isExpired ? colors.red : colors.green);
        
        // Paso 2: Probar endpoint protegido
        console.log();
        log(`🛡️ Probando endpoint protegido con el token...`, colors.yellow);
        
        const protectedResponse = await makeRequest(
          `${BACKEND_URL}/api/proyectos`, 
          'GET', 
          null, 
          { 'Authorization': `Bearer ${token}` }
        );
        
        log(`📥 Respuesta del endpoint protegido:`, colors.yellow);
        log(`   Status: ${protectedResponse.status}`, colors.cyan);
        
        if (protectedResponse.status === 200) {
          log(`✅ ¡Acceso autorizado al endpoint protegido!`, colors.green);
          const data = JSON.parse(protectedResponse.data);
          log(`   Datos recibidos: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, colors.cyan);
        } else {
          log(`⚠️ Acceso denegado: ${protectedResponse.data}`, colors.yellow);
        }
        
      } catch (decodeError) {
        log(`❌ Error al decodificar el token: ${decodeError.message}`, colors.red);
      }
      
    } else if (loginResponse.status === 401) {
      log(`⚠️ Credenciales inválidas (usuario no existe - esto es normal para prueba)`, colors.yellow);
      log(`   Respuesta: ${loginResponse.data}`, colors.cyan);
    } else if (loginResponse.status === 400) {
      log(`⚠️ Error de validación`, colors.yellow);
      log(`   Respuesta: ${loginResponse.data}`, colors.cyan);
    } else {
      log(`❌ Error inesperado: ${loginResponse.status}`, colors.red);
      log(`   Respuesta: ${loginResponse.data}`, colors.cyan);
    }

  } catch (error) {
    log(`❌ Error en el flujo de login: ${error.message}`, colors.red);
  }

  // Instrucciones para crear un usuario de prueba
  console.log();
  log(`${colors.bold}💡 INSTRUCCIONES PARA CREAR USUARIO DE PRUEBA:${colors.reset}`, colors.blue);
  log(`Para probar con un usuario real:`, colors.cyan);
  log(`1. Ve a tu frontend en http://localhost:5173`, colors.cyan);
  log(`2. Ve a /register`, colors.cyan);
  log(`3. Crea un usuario con estos datos:`, colors.cyan);
  log(`   - Nombre: Test User`, colors.cyan);
  log(`   - Email: ${testCredentials.email}`, colors.cyan);
  log(`   - Password: ${testCredentials.password}`, colors.cyan);
  log(`   - RUT Empresa: 12345678-9`, colors.cyan);
  log(`   - Razón Social: Empresa de Prueba`, colors.cyan);
  log(`4. Luego vuelve a ejecutar este script`, colors.cyan);
  
  console.log();
  log(`${colors.bold}🔧 DEBUG DEL FRONTEND:${colors.reset}`, colors.blue);
  log(`Si aún tienes problemas:`, colors.cyan);
  log(`1. Abre las DevTools del navegador (F12)`, colors.cyan);
  log(`2. Ve a la pestaña Console`, colors.cyan);
  log(`3. Ve a la pestaña Network`, colors.cyan);
  log(`4. Intenta hacer login y observa:`, colors.cyan);
  log(`   - ¿Se hace la petición HTTP?`, colors.cyan);
  log(`   - ¿Qué respuesta llega?`, colors.cyan);
  log(`   - ¿Se guarda el token en localStorage?`, colors.cyan);
  log(`   - ¿Hay errores en consola?`, colors.cyan);
}

if (require.main === module) {
  testLoginFlow().catch(console.error);
}
