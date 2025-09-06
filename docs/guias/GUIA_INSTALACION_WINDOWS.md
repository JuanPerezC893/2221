# 🗂️ Guía de Instalación - Sistema de Gestión de Residuos (Windows)

> **📋 Guía completa para clonar, instalar y ejecutar el proyecto localmente en Windows**

## 📋 Tabla de Contenidos

1. [Descripción del Sistema](#-descripción-del-sistema)
2. [Requisitos Previos](#-requisitos-previos)
3. [Obtener el Código del Proyecto](#-obtener-el-código-del-proyecto)
4. [Instalación Paso a Paso](#-instalación-paso-a-paso)
5. [Ejecución Automática](#-ejecución-automática)
6. [Ejecución Manual (Alternativa)](#-ejecución-manual-alternativa)
7. [Verificación del Sistema](#-verificación-del-sistema)
8. [Solución de Problemas](#-solución-de-problemas)
9. [Configuración Avanzada](#-configuración-avanzada)

---

## 🎯 Descripción del Sistema

El **Sistema de Gestión de Residuos** es una aplicación web completa que permite:

- 👥 **Gestión de usuarios** con autenticación JWT
- 🏗️ **Administración de proyectos** con ubicaciones geocodificadas
- ♻️ **Registro y seguimiento de residuos**
- 📊 **Dashboard con métricas y gráficos**
- 🗺️ **Mapas interactivos** con ubicaciones de proyectos
- 📱 **Interfaz responsive** para todos los dispositivos

### 🏗️ Arquitectura del Sistema

```
├── 🌐 Backend (Node.js + Express)
│   ├── API RESTful en puerto 5000
│   ├── Base de datos PostgreSQL
│   └── Autenticación JWT
│
├── 🎨 Frontend (React + Vite)
│   ├── Interfaz web en puerto 5173
│   ├── Bootstrap para estilos
│   └── Mapas con Leaflet
│
└── 🗃️ Base de Datos (PostgreSQL)
    ├── Usuarios y autenticación
    ├── Proyectos con coordenadas
    └── Registro de residuos
```

## 🚀 Guía Rápida de Inicio

### ⚡ Para usuarios con experiencia:

```cmd
# 1. Clonar repositorio
git clone https://github.com/tuusuario/GestionDeResiduos.git
cd GestionDeResiduos

# 2. Configurar PostgreSQL
# Crear usuario: gestion_residuos / residuos123
# Crear BD: gestion_residuos_db

# 3. Ejecutar script automático
iniciar-local-windows.bat

# 4. Acceder a http://localhost:5173
# Usuario: test-windows@local.com / TestWindows123!
```

---


## 📥 Instalación Paso a Paso

### 1️⃣ Descargar Node.js

1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support)
3. Ejecuta el instalador y sigue las instrucciones
4. ✅ **Verifica:** Abre `cmd` y ejecuta:
   ```cmd
   node --version
   npm --version
   ```

### 2️⃣ Instalar Git (si no lo tienes)

1. Ve a [git-scm.com](https://git-scm.com/)
2. Descarga e instala Git para Windows
3. Durante la instalación, mantén las opciones por defecto
4. ✅ **Verifica:**
   ```cmd
   git --version
   ```

### 3️⃣ Instalar PostgreSQL

1. Ve a [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Descarga e instala PostgreSQL
3. Durante la instalación:
   - 🔐 **Recuerda la contraseña** del usuario `postgres`
   - 📡 **Puerto:** Mantén el puerto por defecto `5432`
4. ✅ **Verifica:** Busca "pgAdmin 4" en el menú de inicio

### 4️⃣ Configurar la Base de Datos

Abre **pgAdmin 4** o **psql** y ejecuta estos comandos:

```sql
-- 1. Crear usuario para la aplicación
CREATE USER gestion_residuos WITH PASSWORD 'residuos123';

-- 2. Crear base de datos
CREATE DATABASE gestion_residuos_db OWNER gestion_residuos;

-- 3. Dar permisos completos
GRANT ALL PRIVILEGES ON DATABASE gestion_residuos_db TO gestion_residuos;
```

## 📥 Obtener el Código del Proyecto

Si el proyecto está en un repositorio Git (GitHub, GitLab, etc.):

1. **Abre Símbolo del sistema** o **PowerShell**
2. **Navega a donde quieres el proyecto:**
3. **Clona el repositorio:**
   ```cmd
   git clone https://github.com/tuusuario/GestionDeResiduos.git
   ```
   > ⚠️ **Nota:** Reemplaza la URL con la URL real de tu repositorio

4. **Entra a la carpeta del proyecto:**
   ```cmd
   cd GestionDeResiduos
   ```

---

## 🚀 Ejecución Automática

### 🎯 Método Recomendado: Script Automático

El proyecto incluye un script que **automatiza todo el proceso**:

1. **Abre Símbolo del sistema** como Administrador
2. **Navega a la carpeta del proyecto clonado:**
   ```cmd
   cd "C:\ruta\donde\clonaste\GestionDeResiduos"
   ```
3. **Ejecuta el script automático:**
   ```cmd
   iniciar-local-windows.bat
   ```

### 🔄 ¿Qué hace el script automáticamente?

El script `iniciar-local-windows.bat` realiza las siguientes tareas:

1. ✅ **Verifica dependencias** (Node.js, npm, PostgreSQL)
2. 🔧 **Crea archivos de configuración** (.env) si no existen
3. 📦 **Instala dependencias** del backend y frontend
4. 🗃️ **Verifica la conexión** a la base de datos
5. 📊 **Crea la estructura** de tablas automáticamente
6. 🧪 **Ejecuta tests** de verificación
7. 🚀 **Inicia ambos servicios** (backend y frontend)
8. 🌐 **Abre el navegador** automáticamente

### 📊 Resultado Esperado

Al finalizar verás:

```
🎉 ¡APLICACIÓN INICIADA!
========================

📱 Frontend:      http://localhost:5173
🔗 Backend API:   http://localhost:5000/api  
🗃️ Base de datos: PostgreSQL (localhost:5432)

👤 Usuario de prueba creado:
   📧 Email:    test-windows@local.com
   🔐 Password: TestWindows123!

🌍 Geocodificación automática habilitada
```

---

## ⚙️ Ejecución Manual (Alternativa)

Si prefieres ejecutar paso a paso manualmente:

### 1️⃣ Configurar Variables de Entorno

Crea `backend/.env`:
```env
DATABASE_URL=postgresql://gestion_residuos:residuos123@localhost:5432/gestion_residuos_db
PORT=5000
NODE_ENV=development
JWT_SECRET=mi_clave_secreta_para_desarrollo_local_windows_123456789
FRONTEND_URL=http://localhost:5173
```

Crea `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_APP_NAME=Gestión de Residuos - Windows Local
```

### 2️⃣ Instalar Dependencias

**Backend:**
```cmd
cd backend
npm install
```

**Frontend:**
```cmd
cd ../frontend
npm install
cd ..
```

### 3️⃣ Crear Estructura de Base de Datos

```cmd
cd backend
psql -h localhost -U gestion_residuos -d gestion_residuos_db -f database.sql
cd ..
```

### 4️⃣ Iniciar Servicios

**Terminal 1 - Backend:**
```cmd
cd backend
npm start
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm run dev
```

---

## ✅ Verificación del Sistema

### 🌐 Accesos del Sistema

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | http://localhost:5173 | 🎨 Interfaz principal |
| **Backend API** | http://localhost:5000/api | 🔗 API REST |
| **Base de Datos** | localhost:5432 | 🗃️ PostgreSQL |

### 👤 Credenciales de Prueba

El script automático crea un usuario de prueba:
- 📧 **Email:** `test-windows@local.com`
- 🔐 **Contraseña:** `TestWindows123!`

---

## ⚙️ Configuración Avanzada

### 🔧 Variables de Entorno Personalizadas

**Backend (.env):**
```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_residuos_db
DB_USER=gestion_residuos
DB_PASSWORD=residuos123

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Seguridad
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=24h

# Geocodificación (opcional)
GEOCODING_API_KEY=tu_api_key_si_tienes_una

# Logging
LOG_LEVEL=info
```

**Frontend (.env):**
```env
# URLs de conexión
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173

# Configuración de la app
VITE_APP_NAME=Sistema de Gestión de Residuos
VITE_APP_VERSION=1.0.0

# Mapa (opcional)
VITE_MAP_DEFAULT_LAT=-33.4489
VITE_MAP_DEFAULT_LNG=-70.6693
VITE_MAP_DEFAULT_ZOOM=13
```

### 📁 Estructura Completa del Proyecto

```
GestionDeResiduos/                    # ← Carpeta creada al clonar
├── 📄 iniciar-local-windows.bat      # Script de inicio automático
├── 📄 GUIA_INSTALACION_WINDOWS.md    # Esta guía
├── 📄 README.md                      # Documentación general
├── 📄 package.json                   # Dependencias raíz
├── 📁 .git/                          # Carpeta de Git (oculta)
│
├── 🌐 backend/                       # Servidor Node.js
│   ├── 📄 .env                       # Variables de entorno
│   ├── 📄 package.json               # Dependencias backend
│   ├── 📄 index.js                   # Servidor principal
│   ├── 📄 db.js                      # Conexión a base de datos
│   ├── 📄 database.sql               # Estructura de BD
│   ├── 📁 routes/                    # Rutas de la API
│   │   ├── auth.js                   # Autenticación
│   │   ├── proyectos.js              # Gestión de proyectos
│   │   └── residuos.js               # Gestión de residuos
│   └── 📁 utils/                     # Utilidades
│
├── 🎨 frontend/                      # Aplicación React
│   ├── 📄 .env                       # Variables de entorno
│   ├── 📄 package.json               # Dependencias frontend
│   ├── 📄 vite.config.js             # Configuración Vite
│   ├── 📄 index.html                 # HTML principal
│   └── 📁 src/                       # Código fuente
│       ├── 📄 App.jsx                # Componente principal
│       ├── 📄 main.jsx               # Punto de entrada
│       ├── 📁 components/            # Componentes React
│       │   ├── Dashboard.jsx         # Panel principal
│       │   ├── Login.jsx             # Inicio de sesión
│       │   ├── Register.jsx          # Registro
│       │   ├── Layout.jsx            # Diseño general
│       │   └── ...                   # Otros componentes
│       └── 📁 context/               # Contextos React
│           └── AuthContext.jsx       # Contexto de autenticación
│
└── 📁 docs/                          # Documentación adicional
```

---

## ✅ Lista de Verificación Final

Antes de considerar que la instalación está completa, verifica:

- [ ] ✅ Git instalado y funcionando
- [ ] ✅ Proyecto clonado o descargado correctamente
- [ ] ✅ Node.js instalado y funcionando
- [ ] ✅ PostgreSQL instalado y ejecutándose
- [ ] ✅ Base de datos creada con usuario `gestion_residuos`
- [ ] ✅ Script `iniciar-local-windows.bat` ejecutado sin errores
- [ ] ✅ Backend responde en http://localhost:5000/api
- [ ] ✅ Frontend carga en http://localhost:5173
- [ ] ✅ Login funciona con credenciales de prueba
- [ ] ✅ Crear proyecto funciona con geocodificación
- [ ] ✅ Mapa muestra el proyecto creado
- [ ] ✅ Dashboard muestra estadísticas

### 🎉 ¡Felicidades!

Si todos los puntos están marcados, tienes el **Sistema de Gestión de Residuos** funcionando completamente en tu Windows local.

---

> **💡 Consejo:** Guarda esta guía como referencia para futuras instalaciones o si necesitas ayudar a otros usuarios.
