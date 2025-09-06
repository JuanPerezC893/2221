# 🧪 Tests del Sistema

Este directorio contiene todos los tests y verificaciones del Sistema de Gestión de Residuos.

## 📋 Archivos de Tests

### 🔗 **Tests de Conexión**
- `test-connection.js` - Test básico de conexión a la base de datos

### 🌐 **Tests de Backend**
- `test-backend.js` - Tests básicos del backend
- `test-backend-improved.js` - Tests mejorados del backend
- `test-vercel-backend.js` - Tests específicos para deployment en Vercel

### 👤 **Tests de Autenticación**
- `test-login-flow.js` - Test completo del flujo de login y registro

### 🏗️ **Tests de Proyectos**
- `test-project-creation.js` - Test de creación de proyectos
- `test-full-project-creation.js` - Test completo de creación de proyectos

### 🗺️ **Tests de Geocodificación**
- `test-specific-address.js` - Test de geocodificación de direcciones específicas

### 🔢 **Tests de Utilidades**
- `test-unit-conversion.js` - Test de conversión de unidades

## 🚀 Cómo ejecutar los tests

### Desde la raíz del proyecto:

```bash
# Test de conexión a base de datos
node tests/test-connection.js

# Test básico del backend
node tests/test-backend.js

# Test mejorado del backend
node tests/test-backend-improved.js

# Test de flujo de login
node tests/test-login-flow.js

# Test de creación de proyectos
node tests/test-project-creation.js

# Test completo de proyectos
node tests/test-full-project-creation.js

# Test de geocodificación
node tests/test-specific-address.js

# Test de conversiones
node tests/test-unit-conversion.js

# Test para Vercel
node tests/test-vercel-backend.js
```

### Ejecutar todos los tests:

```bash
# En Windows
for %f in (tests\*.js) do node "%f"

# En Linux/Mac
for file in tests/*.js; do node "$file"; done
```

## 📋 Prerequisitos para los tests

- ✅ **Backend ejecutándose** en puerto 5000
- ✅ **Base de datos PostgreSQL** configurada
- ✅ **Variables de entorno** configuradas
- ✅ **Dependencias instaladas** (`npm install`)

## 🎯 Tipos de tests

### 🔍 **Tests Unitarios**
- Verifican funcionalidades específicas
- Ejecutan independientemente

### 🔗 **Tests de Integración**
- Prueban la conexión entre componentes
- Requieren servicios ejecutándose

### 🌐 **Tests E2E**
- Simulan flujos completos de usuario
- Incluyen autenticación, CRUD, etc.

## 📊 Resultados esperados

Los tests exitosos mostrarán:
- ✅ Conexiones establecidas
- ✅ Operaciones CRUD funcionando
- ✅ Autenticación JWT válida
- ✅ Geocodificación automática
- ✅ Conversiones de unidades correctas

---

> 💡 **Tip:** Ejecuta los tests después de cada cambio importante para asegurar que todo funcione correctamente.
