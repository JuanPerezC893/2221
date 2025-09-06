-- Migración para añadir campos de coordenadas a la tabla proyectos
-- Ejecutar este script en la base de datos existente

-- Añadir campos de latitud y longitud
ALTER TABLE proyectos 
ADD COLUMN latitud DECIMAL(10, 8),
ADD COLUMN longitud DECIMAL(11, 8);

-- Comentario sobre las columnas
COMMENT ON COLUMN proyectos.latitud IS 'Latitud de la ubicación del proyecto (-90 a 90)';
COMMENT ON COLUMN proyectos.longitud IS 'Longitud de la ubicación del proyecto (-180 a 180)';

-- Opcional: Asignar coordenadas por defecto (Santiago, Chile) a proyectos existentes
-- UPDATE proyectos SET latitud = -33.4489, longitud = -70.6693 WHERE latitud IS NULL;
