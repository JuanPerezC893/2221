-- Table: empresas
CREATE TABLE IF NOT EXISTS empresas (
    rut VARCHAR(255) PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    direccion VARCHAR(255)
);

-- Table: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(255) NOT NULL, -- Changed to NOT NULL as it's always assigned
    empresa_rut VARCHAR(255) REFERENCES empresas(rut) ON DELETE SET NULL, -- Allow null if company is deleted
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_verificado BOOLEAN DEFAULT FALSE -- Added this column
);

-- Table: proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    fecha_inicio DATE,
    fecha_fin DATE,
    empresa_rut VARCHAR(255) REFERENCES empresas(rut) ON DELETE CASCADE -- If company is deleted, delete projects
);

-- Table: residuos
CREATE TABLE IF NOT EXISTS residuos (
    id_residuo SERIAL PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,
    cantidad DECIMAL NOT NULL,
    unidad VARCHAR(50),
    reciclable BOOLEAN,
    estado VARCHAR(255),
    id_proyecto INT REFERENCES proyectos(id_proyecto) ON DELETE CASCADE -- If project is deleted, delete residues
);

-- Table: trazabilidad
CREATE TABLE IF NOT EXISTS trazabilidad (
    id_trazabilidad SERIAL PRIMARY KEY,
    id_residuo INT REFERENCES residuos(id_residuo) ON DELETE CASCADE, -- If residue is deleted, delete traceability
    qr VARCHAR(255),
    ticket VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);