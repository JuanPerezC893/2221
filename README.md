# 🗂️ Sistema de Gestión de Residuos

> **Sistema completo de gestión y seguimiento de residuos con geocodificación automática**

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5+-lightgrey.svg)](https://expressjs.com/)

## 🚀 Inicio Rápido

### Para Windows:

```cmd
# 1. Clonar repositorio
git clone https://github.com/JuanPerezC893/2221.git
cd 2221

# 2. Configurar PostgreSQL
# Crear usuario: gestion_residuos / residuos123
# Crear BD: gestion_residuos_db

# 3. Ejecutar script automático
iniciar-local-windows.bat

# 4. Acceder a http://localhost:5173
# Usuario: test-windows@local.com / TestWindows123!
```

📋 **[Guía completa para Windows →](docs/guias/GUIA_INSTALACION_WINDOWS.md)**

## 📁 Estructura del Proyecto

```
GestionDeResiduos/
├── 📄 iniciar-local-windows.bat          # Script de inicio automático para Windows
├── 📄 README.md                          # Este archivo
├── 📄 package.json                       # Dependencias raíz
│
├── 🌐 backend/                           # Servidor Node.js + Express
│   ├── 📄 index.js                       # Servidor principal
│   ├── 📄 db.js                          # Conexión PostgreSQL
│   ├── 📄 database.sql                   # Estructura de base de datos
│   ├── 📄 package.json                   # Dependencias backend
│   ├── 📁 routes/                        # Rutas de la API
│   │   ├── auth.js                       # Autenticación JWT
│   │   ├── proyectos.js                  # Gestión de proyectos
│   │   ├── residuos.js                   # Gestión de residuos
│   │   └── trazabilidad.js               # Trazabilidad
│   ├── 📁 services/                      # Servicios
│   │   └── geocoding.js                  # Geocodificación automática
│   └── 📁 utils/                         # Utilidades
│
├── 🎨 frontend/                          # Aplicación React + Vite
│   ├── 📄 index.html                     # HTML principal
│   ├── 📄 vite.config.js                 # Configuración Vite
│   ├── 📄 package.json                   # Dependencias frontend
│   └── 📁 src/                           # Código fuente
│       ├── App.jsx                       # Componente principal
│       ├── main.jsx                      # Punto de entrada
│       ├── 📁 components/                # Componentes React
│       │   ├── Dashboard.jsx             # Panel principal
│       │   ├── Login.jsx & Register.jsx  # Autenticación
│       │   ├── Layout.jsx & Navbar.jsx   # Diseño
│       │   └── ...                       # Otros componentes
│       └── 📁 context/                   # Contextos React
│           └── AuthContext.jsx           # Contexto de autenticación
│
├── 🧪 tests/                             # Tests y verificaciones
│   ├── test-connection.js               # Test de conexión BD
│   ├── test-backend.js                  # Tests del backend
│   ├── test-login-flow.js               # Tests de autenticación
│   └── ...                               # Otros tests
│
└── 📁 docs/                              # Documentación organizada
    ├── 📁 analisis/                      # Análisis técnicos
    ├── 📁 guias/                         # Guías de instalación
    ├── 📁 configuracion/                 # Configuraciones de deploy
    └── 📁 reportes/                      # Reportes y propuestas
```

## 🎯 Características

- 👥 **Gestión de usuarios** con autenticación JWT
- 🏗️ **Administración de proyectos** con ubicaciones geocodificadas
- ♻️ **Registro y seguimiento de residuos** por tipo y cantidad
- 📊 **Dashboard con métricas** y gráficos interactivos
- 🗺️ **Mapas interactivos** con ubicaciones de proyectos
- 📱 **Interfaz responsive** para todos los dispositivos
- 🌍 **Geocodificación automática** de direcciones

## 🛠️ Tecnologías

### Backend
- **Node.js 16+** - Servidor JavaScript
- **Express 5** - Framework web
- **PostgreSQL 12+** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hashing de contraseñas

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool y dev server
- **Bootstrap 5** - Framework CSS
- **Leaflet** - Mapas interactivos
- **Chart.js** - Gráficos y visualizaciones

## 🚀 Instalación Manual

### Prerequisitos

- **Node.js 16+** y **npm**
- **PostgreSQL 12+**
- **Git**

### 1. Configurar Base de Datos

```sql
-- Crear usuario
CREATE USER gestion_residuos WITH PASSWORD 'residuos123';

-- Crear base de datos
CREATE DATABASE gestion_residuos_db OWNER gestion_residuos;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE gestion_residuos_db TO gestion_residuos;
```

### 2. Backend

```bash
cd backend
npm install
npm start  # Puerto 5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev  # Puerto 5173
```

## 📁 Documentación

### 📋 Guías
- 🔨 **[Guía de Instalación Windows](docs/guias/GUIA_INSTALACION_WINDOWS.md)** - Instalación paso a paso
- 🎨 **[Guía CSS](docs/guias/GUIA_CSS.txt)** - Modificación de estilos

### 📊 Análisis Técnico
- 📈 **[Análisis del Proyecto](docs/analisis/Analisis_Proyecto_Reporte.md)**
- 🗺️ **[Análisis Frontend](docs/analisis/Analisis_Frontend_Reporte.md)**
- 🗺️ **[Análisis Base de Datos](docs/analisis/Analisis_Base_Datos_Reporte.md)**

### ⚙️ Configuración y Deploy
- 🛰️ **[Deploy Vercel](docs/configuracion/DEPLOYMENT_VERCEL.md)**
- 🗺️ **[Geocodificación](docs/configuracion/GEOCODING_AUTOMATIC.md)**
- 🗺️ **[Configuración Neon](docs/configuracion/NEON_SETUP.md)**

### 📈 Reportes
- 🔍 **[Reporte de Salud Backend](docs/reportes/BACKEND_HEALTH_REPORT.md)**
- 📋 **[Criterios Técnicos](docs/reportes/Criterios_Reporte.md)**
- 📈 **[Propuestas de Mejora](docs/reportes/Propuesta_Mejora_Documentacion.md)**

### 🧪 Tests
- 🔧 **[Guía de Tests](tests/README.md)** - Cómo ejecutar tests
- 🔍 **Tests de conexión, backend, autenticación y geocodificación**
- ⚙️ **Tests unitarios y de integración**

## 📱 Uso del Sistema

### Accesos
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Base de datos:** localhost:5432

### Credenciales de Prueba
- **Email:** test-windows@local.com
- **Contraseña:** TestWindows123!

### Funcionalidades Principales
1. **Registro/Login** de usuarios
2. **Crear proyectos** con geocodificación automática
3. **Gestionar residuos** por tipo y cantidad
4. **Dashboard** con métricas y gráficos
5. **Mapa interactivo** con ubicaciones de proyectos

## 🔧 Desarrollo

- **Formato:** El proyecto usa Bootstrap y estilos personalizados
- **API:** RESTful con autenticación JWT
- **Base de Datos:** PostgreSQL con migraciones automáticas
- **Geocodificación:** Servicio automático para direcciones

---

🎆 **¡Sistema listo para producción!** - Compatible con Vercel, Neon Database y otros servicios cloud.


