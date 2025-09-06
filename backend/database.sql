
CREATE TABLE empresas (
    rut VARCHAR(255) PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    direccion VARCHAR(255)
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(255),
    empresa_rut VARCHAR(255) REFERENCES empresas(rut),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    fecha_inicio DATE,
    fecha_fin DATE,
    empresa_rut VARCHAR(255) REFERENCES empresas(rut)
);

CREATE TABLE residuos (
    id_residuo SERIAL PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,
    cantidad DECIMAL NOT NULL,
    unidad VARCHAR(50),
    reciclable BOOLEAN,
    estado VARCHAR(255),
    id_proyecto INT REFERENCES proyectos(id_proyecto)
);

CREATE TABLE trazabilidad (
    id_trazabilidad SERIAL PRIMARY KEY,
    id_residuo INT REFERENCES residuos(id_residuo),
    qr VARCHAR(255),
    ticket VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
