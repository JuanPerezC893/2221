Actualizaciones del Proyecto - 8 de septiembre de 2025

Este documento resume las principales actualizaciones y mejoras realizadas en el proyecto hoy.

---

## 1. Resumen de Cambios por Funcionalidad

### 1.1. Registro y Autenticación

*   **Verificación de Correo Electrónico:**
    *   **Flujo Completo:** Implementado un sistema robusto para verificar la autenticidad del correo electrónico del usuario. Al registrarse, se envía un email con un enlace de verificación.
    *   **Backend (`backend/routes/auth.js`, `backend/services/emailService.js`):
        *   Genera un token JWT para la verificación.
        *   Envía el email usando `Nodemailer` (configurado con Gmail).
        *   Nueva ruta `/api/auth/verify-email/:token` para procesar la verificación.
        *   El login ahora requiere que el email esté verificado.
    *   **Frontend (`frontend/src/components/Login.jsx`, `frontend/src/components/VerificationFailed.jsx`, `frontend/src/App.jsx`):
        *   Muestra mensajes de éxito/error en la página de login tras la verificación.
        *   Nueva página `/verification-failed` para errores de verificación.
*   **Mensajes de Error de Registro más Específicos (`backend/routes/auth.js`):
    *   El formulario de registro ahora devuelve mensajes claros si el email o el RUT de la empresa ya están registrados.
*   **Formato Automático de RUT (`frontend/src/components/Register.jsx`):
    *   El campo RUT se formatea automáticamente a `XXXXXXXX-X` mientras se escribe.
    *   Validación en el envío del formulario para asegurar que el RUT tenga 9 caracteres (8 dígitos + verificador).
*   **Navegación en Formularios de Autenticación:
    *   Enlace "Ya tienes cuenta? Inicia sesión" añadido al formulario de registro.
    *   Enlace "¿Olvidaste tu contraseña?" añadido al formulario de login.
*   **Nombre de Usuario en la Barra de Navegación (`frontend/src/components/Navbar.jsx`, `frontend/src/context/AuthContext.jsx`):
    *   El nombre del usuario ahora se muestra en el saludo "Hola, [Nombre]" en la barra de navegación.

### 1.2. Gestión de Proyectos

*   **Fecha de Fin Obligatoria (`frontend/src/components/ProjectForm.jsx`, `backend/middleware/validators.js`):
    *   El campo `Fecha de Fin` ahora es obligatorio tanto en el frontend como en el backend.
*   **Alertas de Éxito Integradas (`frontend/src/components/ProjectForm.jsx`):
    *   Al crear o actualizar un proyecto, se muestra una alerta de éxito dentro de la aplicación (no una alerta nativa del navegador) antes de redirigir al dashboard.

### 1.3. Gestión de Residuos

*   **Tipo de Residuo como Menú Desplegable (`frontend/src/components/WasteForm.jsx`):
    *   El campo "Tipo de Residuo" ahora es un menú desplegable con opciones predefinidas (Hormigón, Ladrillos, Tierra, etc.).
*   **Optimización de Código (`frontend/src/components/AddWaste.jsx`):
    *   Se eliminó el código obsoleto relacionado con el autocompletado del tipo de residuo.

### 1.4. Navegación General

*   **Reordenamiento de Enlaces en la Barra de Navegación (`frontend/src/components/Navbar.jsx`):
    *   Los enlaces principales se han reordenado a: Dashboard, Agregar Proyecto, Agregar Residuo, Residuos, Mapa.

---

## 2. Notas Importantes y Solución de Problemas

### 2.1. Configuración Inicial (Si es un nuevo setup o tras un `git pull`)

*   **Instalar Dependencias:** Asegúrate de ejecutar `npm install` en las carpetas `backend` y `frontend`.
*   **Configurar `.env`:
    *   Copia `backend/.env.example` a `backend/.env`.
    *   Asegúrate de que `DATABASE_URL` sea correcta.
    *   Configura `EMAIL_USER` (tu email de Gmail) y `EMAIL_PASS` (tu **contraseña de aplicación** de Gmail, no tu contraseña normal).
    *   Asegúrate de que `BACKEND_URL=http://localhost:5000` esté presente.
*   **Migración de Base de Datos:
    *   Si es una base de datos nueva o no tienes la columna `email_verificado`, ejecuta el script:
        ```bash
        "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U gestion_residuos -d gestion_residuos_db -f "C:\Users\albon\2221\backend\migrations\add_email_verification_to_users.sql"
        ```
    *   Si ya tienes la tabla `usuarios` pero le falta la columna, ejecuta:
        ```sql
        ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE;
        ```
*   **Iniciar Servicio PostgreSQL:** Asegúrate de que el servicio de PostgreSQL esté "En ejecución" y configurado como "Automático" en `services.msc` de Windows.

### 2.2. Errores Comunes y Soluciones

*   **`AggregateError [ECONNREFUSED]`:
    *   **Causa:** El servicio de PostgreSQL no está corriendo o no es accesible.
    *   **Solución:** Ve a `services.msc` y asegúrate de que el servicio `postgresql-x64-17` (o similar) esté "En ejecución". Configúralo como "Automático" en sus propiedades.
*   **`Error: Missing credentials for "PLAIN"` (al enviar email):
    *   **Causa:** Las variables `EMAIL_USER` o `EMAIL_PASS` no están configuradas correctamente en `backend/.env`, o `EMAIL_PASS` no es una "contraseña de aplicación" de Gmail.
    *   **Solución:** Verifica el archivo `backend/.env`. Asegúrate de que `EMAIL_USER` y `EMAIL_PASS` tengan valores correctos y que `EMAIL_PASS` sea la contraseña de 16 caracteres generada por Google.
*   **Página en blanco al hacer clic en el enlace de verificación del email:
    *   **Causa:** El enlace de verificación en el email apunta a una URL incorrecta (al frontend en lugar del backend).
    *   **Solución:** Asegúrate de que `BACKEND_URL=http://localhost:5000` esté correctamente configurado en `backend/.env` y que hayas reiniciado la aplicación después de configurarlo. Debes registrar un **nuevo usuario** para que se envíe un email con el enlace corregido.
*   **Nombre de usuario no aparece en la barra de navegación:
    *   **Causa:** Posiblemente caché del navegador.
    *   **Solución:** Realiza una recarga forzada del navegador (Ctrl+F5 en Windows/Linux, Cmd+Shift+R en Mac). Si el problema persiste, asegúrate de haber iniciado sesión de nuevo para obtener un token actualizado.

---

Este documento te servirá como una guía rápida para entender y mantener las nuevas funcionalidades.
