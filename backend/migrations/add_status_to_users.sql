-- 1. Añade la columna 'estado' que permite nulos temporalmente
ALTER TABLE usuarios ADD COLUMN estado VARCHAR(50);

-- 2. Actualiza todos los usuarios existentes para que tengan el estado 'aprobado'
-- Esto asegura que los usuarios actuales puedan seguir iniciando sesión
UPDATE usuarios SET estado = 'aprobado';

-- 3. (Opcional pero recomendado) Añade una restricción NOT NULL si todos los usuarios deben tener un estado
-- ALTER TABLE usuarios ALTER COLUMN estado SET NOT NULL;

-- Comentario para el desarrollador:
-- La lógica de la aplicación (backend/routes/auth.js) debe ser actualizada para:
-- a) Establecer el estado a 'pendiente' para nuevos usuarios en empresas existentes.
-- b) Establecer el estado a 'aprobado' para el primer usuario (admin) de una nueva empresa.
-- c) Modificar el endpoint de login para rechazar a usuarios con estado 'pendiente'.
