
# Análisis de Arquitectura y Ciberseguridad

**Fecha de Análisis:** 20 de octubre de 2025
**Versión:** Análisis basado en el estado actual del repositorio.

## Resumen Ejecutivo

El proyecto presenta una arquitectura moderna y bien definida, con una clara separación entre el backend (Node.js/Express) y el frontend (React/Vite). La base de la seguridad es sólida, utilizando herramientas estándar de la industria como JWT, bcrypt y Helmet.

Sin embargo, se han identificado varias áreas críticas de mejora, principalmente en la gestión de secretos, la seguridad del almacenamiento de tokens en el cliente y la formalización de la estrategia de pruebas. Este informe detalla los hallazgos y proporciona recomendaciones accionables para mitigar riesgos y mejorar la calidad general del proyecto.

---

## 1. Arquitectura General

### 1.1. Descripción

- **Backend:** Aplicación monolítica con Node.js y Express, que expone una API RESTful para gestionar la lógica de negocio y la interacción con la base de datos.
- **Frontend:** Single Page Application (SPA) desarrollada con React y Vite, que consume la API del backend.
- **Base de Datos:** PostgreSQL, gestionada en un servicio externo (Neon), lo cual es una excelente práctica para la escalabilidad y mantenibilidad.
- **Despliegue:** El proyecto está configurado para un despliegue continuo en Vercel, tanto para el frontend como para el backend (configurado como serverless functions).

### 1.2. Puntos Fuertes

- **Separación de incumbencias:** La división clara entre frontend y backend facilita el desarrollo paralelo y el mantenimiento.
- **Stack Tecnológico Moderno:** El uso de React, Vite, Node.js y Express es relevante y cuenta con un amplio soporte de la comunidad.
- **Infraestructura como Servicio (IaaS/PaaS):** Utilizar Vercel y Neon abstrae la complejidad de la infraestructura, permitiendo al equipo centrarse en el desarrollo de funcionalidades.
- **Manejo de Errores Centralizado:** El backend cuenta con un middleware (`errorHandler.js`) para la gestión de errores, lo cual es una buena práctica.

### 1.3. Sugerencias de Mejora

- **Scripts de Desarrollo:** El script `iniciar-local-windows.bat` es útil pero limita el desarrollo a un solo sistema operativo y es propenso a errores.
    - **Recomendación:** Crear scripts cross-platform en el `package.json` raíz del proyecto utilizando herramientas como `npm-run-all` o `concurrently` para orquestar el inicio del backend y frontend con un solo comando (ej: `npm run dev`).
- **Consistencia en las Respuestas de la API:** Estandarizar un formato de respuesta para toda la API.
    - **Recomendación:** Adoptar una estructura consistente como `{ "status": "success", "data": {...} }` para respuestas exitosas y `{ "status": "error", "message": "...", "details": [...] }` para errores. Esto mejora la predictibilidad en el frontend.

---

## 2. Análisis de Ciberseguridad

### 2.1. Descripción General

El proyecto implementa controles de seguridad fundamentales: `bcrypt` para el hashing de contraseñas, `jsonwebtoken` (JWT) para la gestión de sesiones, `helmet` para añadir cabeceras de seguridad HTTP y `express-validator` para la sanitización de entradas.

### 2.2. Vulnerabilidades y Riesgos Identificados

#### **🔴 Crítico: Secretos y Credenciales Hardcodeadas**

- **Hallazgo:** El script `iniciar-local-windows.bat` crea archivos `.env` con valores por defecto, incluyendo el `JWT_SECRET`, tokens de servicios de terceros (Mapbox, EmailJS) y credenciales de la base de datos.
- **Riesgo:** **Muy Alto.** Si un desarrollador ejecuta este script y accidentalmente comete el archivo `.env` al repositorio, todas las credenciales quedarían expuestas públicamente. Usar secretos predecibles en desarrollo facilita ataques de fuerza bruta.
- **Recomendación:**
    1.  **Eliminar inmediatamente** la creación de archivos `.env` desde el script.
    2.  Mantener únicamente los archivos `.env.example` en el repositorio con valores genéricos (ej: `JWT_SECRET=your_super_secret_key`).
    3.  Instruir a los desarrolladores para que creen sus propios archivos `.env` manualmente a partir de los `.env.example`.

#### **🟡 Alto: Almacenamiento Inseguro de JWT en el Frontend**

- **Hallazgo:** El `AuthContext.jsx` almacena el token JWT en `localStorage`.
- **Riesgo:** **Alto.** El `localStorage` es accesible mediante JavaScript. Si la aplicación sufre un ataque de Cross-Site Scripting (XSS), un atacante puede inyectar un script que robe el token y lo envíe a un servidor malicioso, permitiéndole suplantar la identidad del usuario.
- **Recomendación:**
    - **Opción A (Ideal):** Modificar el backend de autenticación (`/login`) para que devuelva el token en una **cookie `HttpOnly` y `Secure`**. El navegador se encargará de enviarla en cada petición, y no será accesible por JavaScript, mitigando el riesgo de robo por XSS.
    - **Opción B (Mejora):** Si se mantiene el almacenamiento en el cliente, considerar el uso de `sessionStorage` que, aunque también es vulnerable a XSS, al menos se elimina al cerrar la pestaña.

#### **🟡 Medio: Control de Acceso Incompleto en el Backend**

- **Hallazgo:** El frontend implementa rutas privadas (`PrivateRoute.jsx`) que verifican el rol del usuario. El backend también tiene middleware de autorización (`auth.js`), y lo aplica correctamente en rutas críticas como `DELETE /api/proyectos/:id` (solo para `admin`). Sin embargo, rutas como `POST /api/proyectos` o `PUT /api/proyectos/:id` solo verifican que el usuario esté autenticado, pero no qué rol tiene.
- **Riesgo:** **Medio.** Un usuario autenticado con un rol no privilegiado (ej: un futuro rol de "lector") podría, teóricamente, llamar a la API directamente con una herramienta como Postman y crear o modificar proyectos, saltándose la lógica de la interfaz. **La seguridad del frontend es solo una mejora de UX, la real debe estar en el backend.**
- **Recomendación:** Aplicar el middleware de autorización (`authorize([...roles])`) en **todas las rutas del backend** que impliquen creación, modificación o eliminación de datos, especificando qué roles tienen permiso para cada acción.

### 2.3. Puntos Fuertes en Seguridad

- **Prevención de SQL Injection:** El uso consistente de consultas parametrizadas con la librería `pg` en todo el backend (ej: `proyectos.js`) es la defensa más efectiva contra ataques de inyección SQL. **Este es un gran acierto.**
- **Hashing de Contraseñas:** El uso de `bcrypt` con un `salt` es el estándar de la industria para almacenar contraseñas de forma segura.
- **Validación de Entradas:** El uso de `express-validator` en las rutas de autenticación es una excelente práctica para prevenir datos malformados. Se recomienda extender su uso a todas las rutas que reciban datos del cliente.

---

## 3. Salud y Calidad del Proyecto

### 3.1. Descripción

El proyecto está bien organizado, con una estructura de directorios lógica y un esfuerzo visible en la documentación, lo cual es excelente para la mantenibilidad a largo plazo.

### 3.2. Puntos Fuertes

- **Estructura de Proyecto:** La separación en `frontend`, `backend`, `docs` y `tests` es clara e intuitiva.
- **Documentación Inicial:** La existencia de una carpeta `docs` con guías de instalación, configuración y análisis es un diferenciador clave y de gran valor.
- **Builds Reproducibles:** La presencia de `package-lock.json` en ambos subproyectos asegura que todos los desarrolladores y el sistema de CI/CD usen las mismas versiones de las dependencias.

### 3.3. Sugerencias de Mejora

- **Estrategia de Pruebas:**
    - **Hallazgo:** La carpeta `tests` contiene scripts para pruebas manuales o de "health-check" que se ejecutan contra un entorno desplegado. No existe un framework de pruebas automatizadas.
    - **Riesgo:** La falta de pruebas unitarias y de integración hace que sea difícil y arriesgado añadir nuevas funcionalidades o refactorizar el código existente sin introducir regresiones (bugs en funcionalidades que antes servían).
    - **Recomendación:**
        1.  **Backend:** Integrar un framework como **Jest** o **Mocha/Chai**. Empezar creando pruebas unitarias para la lógica de negocio en `services` y pruebas de integración para las rutas de la API, utilizando una base de datos de prueba.
        2.  **Frontend:** Utilizar **Vitest** (que se integra nativamente con Vite) y **React Testing Library** para probar componentes individuales y flujos de usuario.

- **Consistencia de Código (Linting y Formato):**
    - **Hallazgo:** El frontend tiene una configuración de ESLint, pero el backend no. No se usa un formateador de código automático como Prettier.
    - **Riesgo:** Inconsistencias en el estilo del código, lo que dificulta la lectura y puede llevar a errores sutiles.
    - **Recomendación:**
        1.  Añadir **ESLint** y **Prettier** al backend.
        2.  Configurar Prettier en ambos proyectos para que se ejecute automáticamente al guardar un archivo o antes de hacer un commit (usando `husky` y `lint-staged`). Esto unificará el estilo de todo el código base sin esfuerzo manual.
