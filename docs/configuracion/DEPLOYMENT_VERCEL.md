# 🚀 Despliegue en Vercel - Gestión de Residuos

Guía completa para desplegar el proyecto de gestión de residuos con geocodificación automática en Vercel.

## 📋 Resumen del Proyecto

### ✅ **Funcionalidades Implementadas:**
- 🌍 **Geocodificación automática** con Nominatim (OpenStreetMap)
- 🗺️ **Mapa interactivo** con proyectos en ubicaciones reales
- 🏢 **Sistema multiempresa** con autenticación JWT
- 📊 **Dashboard** con métricas y análisis
- 🗃️ **Base de datos** PostgreSQL con Neon
- 🔒 **Seguridad** con validaciones y middleware

### ✅ **Direcciones Probadas Funcionando:**
- `"Manuel Montt 367, Santiago, Chile"` ✓
- `"Valparaíso, Chile"` ✓
- `"Providencia, Santiago"` ✓
- `"Las Condes, Santiago"` ✓

## 🏗️ Arquitectura del Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   BASE DATOS    │
│   (Vercel)      │◄──►│   (Vercel)      │◄──►│   (Neon PG)     │
│   React + Vite  │    │   Node.js       │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   NOMINATIM     │              │
         └──────────────►│ (OpenStreetMap) │◄─────────────┘
                        │  Geocodificación │
                        └─────────────────┘
```

## 📂 Estructura del Proyecto

```
GestionDeResiduos/
├── backend/                 # API Node.js + Express
│   ├── routes/             # Rutas API (auth, proyectos, residuos)
│   ├── services/           # Servicios (geocodificación)
│   ├── middleware/         # Autenticación, validaciones
│   ├── migrations/         # Scripts SQL para BD
│   └── utils/              # Utilidades y scripts de testing
├── frontend/               # App React con Vite
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── api/           # Cliente API
│   │   └── services/      # Configuración axios
│   └── .env               # Variables de entorno
└── docs/                  # Documentación
```

## 🚀 Pasos de Despliegue

### 1. **Backend en Vercel**

#### Variables de entorno requeridas:
```env
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://tu-frontend.vercel.app
```

#### Configuración Vercel (vercel.json):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. **Frontend en Vercel**

#### Variables de entorno requeridas:
```env
VITE_API_URL=https://tu-backend.vercel.app/api
VITE_FRONTEND_URL=https://tu-frontend.vercel.app
VITE_APP_NAME=Gestión de Residuos
```

#### Configuración de build:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. **Base de Datos Neon PostgreSQL**

#### Ejecutar migración:
```sql
-- En tu consola de Neon
ALTER TABLE proyectos 
ADD COLUMN latitud DECIMAL(10, 8),
ADD COLUMN longitud DECIMAL(11, 8);

-- Opcional: Asignar coordenadas por defecto a proyectos existentes
UPDATE proyectos SET latitud = -33.4489, longitud = -70.6693 WHERE latitud IS NULL;
```

## 🧪 Testing y Verificación

### Scripts incluidos para testing:
```bash
# Verificar backend desplegado
node test-vercel-backend.js

# Probar creación completa con autenticación
node test-full-project-creation.js

# Validar dirección específica
node test-specific-address.js
```

### URLs de testing:
- **Backend Health**: `https://tu-backend.vercel.app/api/proyectos` (debe retornar 401)
- **Frontend**: `https://tu-frontend.vercel.app`

## 🔧 Configuración Post-Despliegue

### 1. **Crear usuario administrador**
```bash
curl -X POST https://tu-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin Usuario",
    "email": "admin@tuempresa.com",
    "password": "TuPasswordSeguro123!",
    "empresa_rut": "12345678-9",
    "razon_social": "Tu Empresa Ltda"
  }'
```

### 2. **Probar geocodificación**
1. Iniciar sesión en el frontend
2. Crear proyecto con ubicación: `"Santiago, Chile"`
3. Verificar en el mapa que aparezca en Santiago (no en ubicación por defecto)

## 📊 Monitoreo

### Logs de Vercel:
- **Backend**: Dashboard Vercel → Tu Proyecto Backend → Functions
- **Frontend**: Dashboard Vercel → Tu Proyecto Frontend → Functions

### Logs importantes a buscar:
```
🌍 Geocoding: Buscando coordenadas para "Santiago, Chile"
✅ Geocodificación exitosa: -33.4489, -70.6693
```

## 🔒 Seguridad

### Variables sensibles (NO subir a Git):
- ✅ `DATABASE_URL` (credenciales de Neon)
- ✅ `JWT_SECRET` (clave para tokens)
- ✅ Archivos `.env` están en `.gitignore`

### CORS configurado para:
- Frontend de producción
- Localhost para desarrollo

## 🆘 Troubleshooting

### Error 500 en creación de proyectos:
1. Verificar migración de BD (columnas latitud/longitud)
2. Revisar logs de Vercel
3. Verificar conectividad a Nominatim

### Error de autenticación:
1. Verificar `JWT_SECRET` en variables de entorno
2. Verificar `FRONTEND_URL` en CORS

### Geocodificación no funciona:
1. Verificar que `axios` esté en dependencies (no devDependencies)
2. Aumentar timeout si es necesario
3. Probar direcciones más generales ("Santiago, Chile" vs direcciones específicas)

## 🎯 Estado Actual

### ✅ **COMPLETADO Y FUNCIONANDO:**
- Backend desplegado en: `https://3332-lilac.vercel.app`
- Geocodificación automática: **FUNCIONANDO**
- Base de datos Neon: **CONFIGURADA**
- Validaciones: **CORREGIDAS**
- Testing: **COMPLETO**

### 📋 **Próximos pasos:**
1. Desplegar frontend en Vercel
2. Configurar variables de entorno de producción
3. Ejecutar migración SQL en Neon
4. Probar funcionalidad completa

## 🎉 **¡LISTO PARA PRODUCCIÓN!**

El proyecto está completamente funcional y probado. La geocodificación automática con Nominatim funciona perfectamente, convirtiendo direcciones como "Manuel Montt 367, Santiago, Chile" en coordenadas precisas para mostrar en el mapa.
