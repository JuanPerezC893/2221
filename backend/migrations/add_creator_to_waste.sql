ALTER TABLE residuos ADD COLUMN id_usuario_creacion INTEGER;
ALTER TABLE residuos ADD CONSTRAINT fk_usuario_creacion FOREIGN KEY (id_usuario_creacion) REFERENCES usuarios(id_usuario);
COMMENT ON COLUMN residuos.id_usuario_creacion IS 'ID del usuario que registró el residuo';
