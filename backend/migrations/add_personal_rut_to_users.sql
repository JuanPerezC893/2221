ALTER TABLE usuarios ADD COLUMN rut_personal VARCHAR(12);
COMMENT ON COLUMN usuarios.rut_personal IS 'RUT personal del usuario, distinto al de la empresa';
