@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Configuración de rutas
set "PSQL_PATH=C:\Program Files\PostgreSQL\17\bin\psql.exe"

echo.
echo 🚀 GESTIÓN DE RESIDUOS - INICIO AUTOMÁTICO
echo ==========================================
echo.
echo 🚀 Iniciando aplicación directamente (sin verificación de dependencias)...
echo.

:: VERIFICAR ARCHIVOS DE CONFIGURACIÓN
echo ⚙️  Verificando configuración...

:: Verificar backend/.env
if not exist "%~dp0backend\.env" (
    echo ❌ Archivo backend/.env no encontrado
    echo 📝 Creando archivo de configuración...
    
    echo # Base de datos local PostgreSQL > "%~dp0backend\.env"
    echo DATABASE_URL=postgresql://gestion_residuos:residuos123@localhost:5432/gestion_residuos_db >> "%~dp0backend\.env"
    echo. >> "%~dp0backend\.env"
    echo # Configuración del servidor >> "%~dp0backend\.env"
    echo PORT=5000 >> "%~dp0backend\.env"
    echo NODE_ENV=development >> "%~dp0backend\.env"
    echo. >> "%~dp0backend\.env"
    echo # JWT Secret >> "%~dp0backend\.env"
    echo JWT_SECRET=mi_clave_secreta_para_desarrollo_local_windows_123456789 >> "%~dp0backend\.env"
    echo. >> "%~dp0backend\.env"
    echo # URL del frontend ^(para CORS^) >> "%~dp0backend\.env"
    echo FRONTEND_URL=http://localhost:5173 >> "%~dp0backend\.env"
    
    echo ✅ Archivo backend/.env creado
) else (
    echo ✅ Archivo backend/.env ya existe
)

:: Verificar frontend/.env  
if not exist "%~dp0frontend\.env" (
    echo ❌ Archivo frontend/.env no encontrado
    echo 📝 Creando archivo de configuración...
    
    echo # Variables de entorno para desarrollo local > "%~dp0frontend\.env"
    echo VITE_API_URL=http://localhost:5000/api >> "%~dp0frontend\.env"
    echo VITE_FRONTEND_URL=http://localhost:5173 >> "%~dp0frontend\.env"
    echo VITE_APP_NAME=Gestión de Residuos - Windows Local >> "%~dp0frontend\.env"
    
    echo ✅ Archivo frontend/.env creado
) else (
    echo ✅ Archivo frontend/.env ya existe
)

:: 3. INSTALAR DEPENDENCIAS
echo.
echo 📦 Verificando dependencias npm...

:: Backend
cd /d "%~dp0backend"
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
cd /d "%~dp0frontend"
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

cd /d "%~dp0"

:: 4. VERIFICAR BASE DE DATOS

:: Verificar estructura de tablas

echo 🔍 Verificando estructura de tablas...
if not exist "%~dp0backend\checkTable.txt" (
    echo ⚠️  Estructura de BD incompleta, ejecutando database.sql...
    echo La contraseña es residuos123
    cd /d "%~dp0backend"    
    "%PSQL_PATH%" -h localhost -U gestion_residuos -d gestion_residuos_db -f database.sql
    cd /d "%~dp0"
    if errorlevel 1 (
        echo ❌ Error ejecutando database.sql
        echo 🔧 Ejecuta manualmente: "%PSQL_PATH%" -h localhost -U gestion_residuos -d gestion_residuos_db -f backend/database.sql
        pause
        exit /b 1
    )
    echo ✅ Estructura de BD creada
    echo ✅ Estructura de BD creada >> "%~dp0backend\checkTable.txt"
)



:: 6. INICIAR SERVICIOS
echo.
echo 🚀 Iniciando servicios...

:: Crear scripts temporales para evitar problemas con rutas
echo 🚀 Creando scripts de inicio temporales...

echo @echo off > temp_backend.bat
echo cd /d "%CD%\backend" >> temp_backend.bat
echo echo 🌐 BACKEND - Puerto 5000 >> temp_backend.bat
echo echo. >> temp_backend.bat
echo node index.js >> temp_backend.bat
echo pause >> temp_backend.bat

echo @echo off > temp_frontend.bat
echo cd /d "%CD%\frontend" >> temp_frontend.bat
echo echo 🎨 FRONTEND - Puerto 5173 >> temp_frontend.bat
echo echo. >> temp_frontend.bat
echo npm run dev >> temp_frontend.bat
echo pause >> temp_frontend.bat

:: Iniciar Backend usando script temporal
echo 🌐 Iniciando backend en puerto 5000...
start "🌐 Backend - Gestión Residuos" temp_backend.bat

:: Esperar a que backend inicie
echo ⏳ Esperando a que backend inicie...
timeout /t 3 >nul

:: Iniciar Frontend usando script temporal
echo 🎨 Iniciando frontend en puerto 5173...
start "🎨 Frontend - Gestión Residuos" temp_frontend.bat


echo.
echo ⏳ Esperando a que los servicios inicien completamente...
timeout /t 5 >nul

:: 8. INFORMACIÓN FINAL
echo.
echo 🎉 ¡APLICACIÓN INICIADA!
echo ========================
echo.
echo 📱 Frontend:      http://localhost:5173
echo 🔗 Backend API:   http://localhost:5000/api  
echo 🗃️  Base de datos: PostgreSQL (localhost:5432)
echo.

echo 🌐 Abriendo navegador en http://localhost:5173
start http://localhost:5173

echo.
echo ℹ️  Los scripts temporales se eliminarán cuando cierres este script.
echo.

:: Limpiar scripts temporales al final
echo Presiona cualquier tecla para cerrar y limpiar archivos temporales...
pause >nul

echo Limpiando archivos temporales...
if exist temp_backend.bat del temp_backend.bat
if exist temp_frontend.bat del temp_frontend.bat

echo ✅ Limpieza completada.
