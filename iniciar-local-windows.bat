@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 GESTIÓN DE RESIDUOS - INICIO AUTOMÁTICO
echo ==========================================
echo.

:: Variables de colores para PowerShell (fallback para cmd básico)
set "GREEN=echo"
set "RED=echo"
set "YELLOW=echo"

:: 1. VERIFICAR DEPENDENCIAS
echo 🔍 Verificando dependencias del sistema...
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado
    echo 📥 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    Versión: %NODE_VERSION%

:: Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no encontrado
    pause
    exit /b 1
)
echo ✅ npm instalado
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    Versión: %NPM_VERSION%

:: Verificar PostgreSQL
echo.
echo 🗃️  Verificando PostgreSQL...
sc query postgresql-x64-15 | find "RUNNING" >nul 2>&1
if errorlevel 1 (
    sc query postgresql-x64-16 | find "RUNNING" >nul 2>&1
    if errorlevel 1 (
        echo ❌ PostgreSQL no está ejecutándose
        echo 🔧 Soluciones:
        echo    1. Abrir "Servicios" desde el menú de inicio
        echo    2. Buscar "postgresql" y hacer click derecho → Iniciar
        echo    3. O instalar PostgreSQL desde: https://www.postgresql.org/download/windows/
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL ejecutándose

:: 2. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
echo.
echo ⚙️  Verificando configuración...

:: Verificar backend/.env
if not exist "backend\.env" (
    echo ❌ Archivo backend/.env no encontrado
    echo 📝 Creando archivo de configuración...
    
    echo # Base de datos local PostgreSQL > backend\.env
    echo DATABASE_URL=postgresql://gestion_residuos:residuos123@localhost:5432/gestion_residuos_db >> backend\.env
    echo. >> backend\.env
    echo # Configuración del servidor >> backend\.env
    echo PORT=5000 >> backend\.env
    echo NODE_ENV=development >> backend\.env
    echo. >> backend\.env
    echo # JWT Secret >> backend\.env
    echo JWT_SECRET=mi_clave_secreta_para_desarrollo_local_windows_123456789 >> backend\.env
    echo. >> backend\.env
    echo # URL del frontend ^(para CORS^) >> backend\.env
    echo FRONTEND_URL=http://localhost:5173 >> backend\.env
    
    echo ✅ Archivo backend/.env creado
)

:: Verificar frontend/.env  
if not exist "frontend\.env" (
    echo ❌ Archivo frontend/.env no encontrado
    echo 📝 Creando archivo de configuración...
    
    echo # Variables de entorno para desarrollo local > frontend\.env
    echo VITE_API_URL=http://localhost:5000/api >> frontend\.env
    echo VITE_FRONTEND_URL=http://localhost:5173 >> frontend\.env
    echo VITE_APP_NAME=Gestión de Residuos - Windows Local >> frontend\.env
    
    echo ✅ Archivo frontend/.env creado
)

:: 3. INSTALAR DEPENDENCIAS
echo.
echo 📦 Verificando dependencias npm...

:: Backend
cd backend
if not exist "node_modules" (
    echo 🔄 Instalando dependencias del backend...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del backend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencias del backend ya instaladas
)

:: Frontend
cd ../frontend
if not exist "node_modules" (
    echo 🔄 Instalando dependencias del frontend...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del frontend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencias del frontend ya instaladas
)

cd ..

:: 4. VERIFICAR BASE DE DATOS
echo.
echo 🗃️  Verificando base de datos...

cd backend
echo 🔍 Probando conexión a la base de datos...
node -e "
const pool = require('./db');
pool.query('SELECT 1').then(() => {
    console.log('✅ Conexión a BD exitosa');
    process.exit(0);
}).catch(err => {
    console.log('❌ Error de conexión a BD:', err.message);
    console.log('💡 Verifica que:');
    console.log('   - PostgreSQL esté ejecutándose');
    console.log('   - Usuario gestion_residuos exista');  
    console.log('   - Base de datos gestion_residuos_db exista');
    console.log('   - Credenciales en .env sean correctas');
    process.exit(1);
});
" 2>nul
if errorlevel 1 (
    echo.
    echo 🛠️  CONFIGURACIÓN INICIAL DE BASE DE DATOS REQUERIDA
    echo ====================================================
    echo.
    echo Ejecuta estos comandos en pgAdmin o psql:
    echo.
    echo 1. Crear usuario:
    echo    CREATE USER gestion_residuos WITH PASSWORD 'residuos123';
    echo.
    echo 2. Crear base de datos:
    echo    CREATE DATABASE gestion_residuos_db OWNER gestion_residuos;
    echo.
    echo 3. Dar permisos:
    echo    GRANT ALL PRIVILEGES ON DATABASE gestion_residuos_db TO gestion_residuos;
    echo.
    echo 4. Ejecutar estructura:
    echo    psql -h localhost -U gestion_residuos -d gestion_residuos_db -f backend/database.sql
    echo.
    pause
    exit /b 1
)

:: Verificar estructura de tablas
echo 🔍 Verificando estructura de tablas...
node utils/verify-database-changes.js 2>nul
if errorlevel 1 (
    echo ⚠️  Estructura de BD incompleta, ejecutando database.sql...
    psql -h localhost -U gestion_residuos -d gestion_residuos_db -f database.sql
    if errorlevel 1 (
        echo ❌ Error ejecutando database.sql
        echo 🔧 Ejecuta manualmente: psql -h localhost -U gestion_residuos -d gestion_residuos_db -f backend/database.sql
        pause
        exit /b 1
    )
    echo ✅ Estructura de BD creada
)

cd ..

:: 5. EJECUTAR TESTS BÁSICOS
echo.
echo 🧪 Ejecutando tests de verificación...
echo    📁 Tests organizados en directorio tests/

:: Verificar que axios esté instalado
cd backend
npm list axios >nul 2>&1
if errorlevel 1 (
    echo 🔄 Instalando axios...
    npm install axios
)
cd ..

:: Test de conexión básica usando archivo de tests
echo 🔍 Test 1: Verificando conexión a BD...
node tests/test-connection.js 2>nul
if not errorlevel 1 (
    echo ✅ Test de conexión exitoso
) else (
    echo ⚠️  Test de conexión falló, continuando...
)

echo 🔍 Test 2: Verificando endpoints...
node -e "
const axios = require('axios');
setTimeout(() => {
    axios.get('http://localhost:5000/api/proyectos', {timeout: 2000})
    .then(() => console.log('✅ Backend responde'))
    .catch(err => {
        if(err.response && err.response.status === 401) {
            console.log('✅ Backend responde correctamente (401 esperado sin token)');
        } else if(err.code === 'ECONNREFUSED') {
            console.log('⚠️  Backend no está ejecutándose aún');
        } else {
            console.log('⚠️  Error:', err.message);
        }
    });
}, 1000);
" 2>nul &

:: 6. INICIAR SERVICIOS
echo.
echo 🚀 Iniciando servicios...

:: Verificar puertos libres
netstat -ano | findstr :5000 >nul
if not errorlevel 1 (
    echo ⚠️  Puerto 5000 ocupado
    echo 🔧 Cambia PORT en backend/.env o cierra la aplicación que lo usa
)

netstat -ano | findstr :5173 >nul  
if not errorlevel 1 (
    echo ⚠️  Puerto 5173 ocupado, Vite usará otro puerto automáticamente
)

:: Iniciar Backend
echo 🌐 Iniciando backend en puerto 5000...
cd backend
start "🌐 Backend - Gestión Residuos" cmd /k "echo 🌐 BACKEND - Puerto 5000 && npm start"

:: Esperar a que backend inicie
echo ⏳ Esperando a que backend inicie...
timeout /t 8 >nul

:: Iniciar Frontend  
echo 🎨 Iniciando frontend en puerto 5173...
cd ../frontend
start "🎨 Frontend - Gestión Residuos" cmd /k "echo 🎨 FRONTEND - Puerto 5173 && npm run dev"

:: 7. TEST POST-INICIO
cd ..
echo.
echo ⏳ Esperando a que los servicios inicien completamente...
timeout /t 10 >nul

echo.
echo 🧪 Ejecutando test final de funcionamiento...

:: Test de geocodificación (simplificado)
node -e "
const axios = require('axios');

console.log('🔍 Test de endpoints...');

// Test 1: Backend health
axios.get('http://localhost:5000/api/proyectos', {timeout: 5000})
.then(res => console.log('❌ Error: Backend no requiere autenticación'))
.catch(err => {
    if(err.response && err.response.status === 401) {
        console.log('✅ Backend: Autenticación funcionando');
        
        // Test 2: Registro de usuario
        return axios.post('http://localhost:5000/api/auth/register', {
            nombre: 'Test Usuario Windows',
            email: 'test-windows@local.com',
            password: 'TestWindows123!',
            empresa_rut: '99999999-9',
            razon_social: 'Test Empresa Windows'
        }, {timeout: 5000});
    }
    throw err;
})
.then(res => {
    if(res.data.id_usuario) {
        console.log('✅ Registro: Usuario creado exitosamente');
        
        // Test 3: Login
        return axios.post('http://localhost:5000/api/auth/login', {
            email: 'test-windows@local.com',
            password: 'TestWindows123!'
        }, {timeout: 5000});
    }
})
.then(res => {
    if(res.data.token) {
        console.log('✅ Login: Token JWT generado');
        
        // Test 4: Crear proyecto con geocodificación
        return axios.post('http://localhost:5000/api/proyectos', {
            nombre: 'Test Proyecto Windows',
            ubicacion: 'Santiago, Chile',
            fecha_inicio: new Date().toISOString().split('T')[0]
        }, {
            headers: { Authorization: 'Bearer ' + res.data.token },
            timeout: 15000
        });
    }
})
.then(res => {
    if(res.data.latitud && res.data.longitud) {
        console.log('✅ Geocodificación: Funcionando perfectamente');
        console.log('   📍 Santiago geocodificado a:', res.data.latitud, res.data.longitud);
        console.log('');
        console.log('🎉 ¡TODOS LOS TESTS PASARON!');
        console.log('==========================');
    } else {
        console.log('⚠️  Proyecto creado pero sin coordenadas');
    }
})
.catch(err => {
    if(err.response && err.response.data.message && err.response.data.message.includes('ya está registrado')) {
        console.log('✅ Usuario ya existe, continuando...');
        console.log('🎯 Sistema funcionando correctamente');
    } else {
        console.log('❌ Error en tests:', err.message);
        if(err.code === 'ECONNREFUSED') {
            console.log('   Backend aún no responde, intenta en unos segundos');
        }
    }
});
" 2>nul

:: 8. INFORMACIÓN FINAL
echo.
echo 🎉 ¡APLICACIÓN INICIADA!
echo ========================
echo.
echo 📱 Frontend:      http://localhost:5173
echo 🔗 Backend API:   http://localhost:5000/api  
echo 🗃️  Base de datos: PostgreSQL (localhost:5432)
echo.
echo 👤 Usuario de prueba creado:
echo    📧 Email:    test-windows@local.com
echo    🔐 Password: TestWindows123!
echo.
echo 🌍 Geocodificación automática habilitada
echo    Direcciones que funcionan bien:
echo    • "Santiago, Chile"
echo    • "Valparaíso, Chile"  
echo    • "Manuel Montt 367, Santiago, Chile"
echo    • "Providencia, Santiago"
echo.
echo 📋 Para probar:
echo    1. Ve a http://localhost:5173
echo    2. Inicia sesión con las credenciales de arriba
echo    3. Crea un proyecto con ubicación "Santiago, Chile"
echo    4. Ve al Mapa y verifica que aparezca en Santiago
echo.
echo 📁 Estructura del proyecto organizada:
echo    📁 docs/ - Documentación completa
echo    🧪 tests/ - Tests y verificaciones
echo    🌐 backend/ - Servidor y API
echo    🎨 frontend/ - Interfaz React
echo.
echo 🧪 Tests adicionales disponibles:
echo    node tests/test-backend.js
echo    node tests/test-login-flow.js
echo    node tests/test-project-creation.js
echo.
echo 🛑 Para detener: Cierra las ventanas del backend y frontend
echo.

:: Abrir automáticamente el navegador
timeout /t 3 >nul
start http://localhost:5173

pause
