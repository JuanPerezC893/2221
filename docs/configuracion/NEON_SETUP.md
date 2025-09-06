# 🐘 Configuración de Neon PostgreSQL

Esta guía te ayudará a configurar tu base de datos con Neon PostgreSQL para el despliegue en Vercel.

## 🚀 Pasos para configurar Neon

### 1. Crear cuenta en Neon
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Crear una nueva base de datos
1. En el dashboard de Neon, haz clic en **"Create Project"**
2. Elige un nombre para tu proyecto (ej: `gestion-residuos`)
3. Selecciona la región más cercana a tu ubicación
4. Haz clic en **"Create Project"**

### 3. Obtener la cadena de conexión
1. En tu proyecto de Neon, ve a la sección **"Connection Details"**
2. Copia la **"Connection string"** que se ve así:
   ```
   postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 4. Configurar las variables de entorno

#### Para desarrollo local:
1. Crea un archivo `.env` en la carpeta `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edita el archivo `.env` y reemplaza la `DATABASE_URL` con tu cadena de conexión de Neon
3. Agrega tu JWT_SECRET personalizado

#### Para producción en Vercel:
1. Ve a tu proyecto backend en Vercel
2. Ve a **Settings → Environment Variables**
3. Agrega estas variables:
   - `DATABASE_URL`: Tu cadena de conexión de Neon
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Una clave secreta segura
   - `FRONTEND_URL`: La URL de tu frontend desplegado

### 5. Crear las tablas en Neon
1. En el dashboard de Neon, ve a **"SQL Editor"**
2. Ejecuta el contenido de tu archivo `backend/database.sql`
3. O puedes usar un cliente PostgreSQL como pgAdmin o DBeaver para conectarte y ejecutar el script

### 6. Probar la conexión

#### Localmente:
```bash
cd backend
npm run dev
```

#### En producción:
Después del despliegue, tu backend debería conectarse automáticamente a Neon.

## 🔧 Características de la configuración actual

- **SSL habilitado**: Necesario para Neon en producción
- **Connection pooling**: Optimizado para serverless functions
- **Error handling**: Logs de conexión y errores
- **Timeouts configurados**: Para evitar conexiones colgadas

## 📊 Límites del plan gratuito de Neon

- **Storage**: 0.5 GB
- **Compute time**: 100 horas/mes
- **Branches**: 10 branches
- **Databases**: Ilimitadas

## 🛠️ Comandos útiles

### Verificar conexión local:
```bash
cd backend
node -e "require('./db.js').query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); process.exit(); })"
```

### Ejecutar migraciones:
```bash
# Si tienes un archivo de migración
psql "postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/dbname?sslmode=require" -f database.sql
```

## 🔄 Migración desde otra base de datos

Si ya tienes datos en otra base de datos PostgreSQL:

1. **Exportar datos**:
   ```bash
   pg_dump "tu_antigua_conexion" > backup.sql
   ```

2. **Importar a Neon**:
   ```bash
   psql "tu_conexion_neon" -f backup.sql
   ```

## ⚠️ Notas importantes

- Neon cierra conexiones inactivas automáticamente (es serverless)
- El SSL es obligatorio en producción
- Las conexiones se establecen bajo demanda
- Ideal para aplicaciones serverless como Vercel

## 🆘 Troubleshooting

### Error: "connection terminated unexpectedly"
- Verifica que tu DATABASE_URL sea correcta
- Asegúrate de que SSL esté habilitado
- Revisa que no haya caracteres especiales sin escapar en la URL

### Error: "too many connections"
- El pool está configurado para manejar esto automáticamente
- Neon tiene límites de conexión, pero el pool los gestiona

### Error: "database does not exist"
- Asegúrate de que el nombre de la base de datos en la URL sea correcto
- Verifica que hayas creado las tablas con el script SQL
