# Análisis de la Estructura de la Base de Datos

Este documento describe la estructura de la base de datos del proyecto, asumiendo que las migraciones pendientes (`add_personal_rut_to_users.sql` y `add_creator_to_waste.sql`) han sido aplicadas.

---

## Esquema de Tablas

A continuación se detallan las tablas, sus columnas y los tipos de datos inferidos.

- **PK**: Clave Primaria (Primary Key)
- **FK**: Clave Foránea (Foreign Key)

### 1. Tabla `empresas`
Almacena la información de cada empresa constructora registrada.

| Columna        | Tipo de Dato | Descripción                               |
|----------------|--------------|-------------------------------------------|
| `rut`          | `VARCHAR`    | **(PK)** RUT único de la empresa.         |
| `razon_social` | `VARCHAR`    | Nombre o razón social de la empresa.      |
| `direccion`    | `TEXT`       | Dirección física de la empresa.           |

### 2. Tabla `usuarios`
Contiene los datos de los usuarios que pueden acceder al sistema.

| Columna            | Tipo de Dato | Descripción                                               |
|--------------------|--------------|-----------------------------------------------------------|
| `id_usuario`       | `SERIAL`     | **(PK)** Identificador numérico único del usuario.        |
| `nombre`           | `VARCHAR`    | Nombre completo del usuario.                              |
| `email`            | `VARCHAR`    | Correo electrónico del usuario (debe ser único).          |
| `password`         | `VARCHAR`    | Contraseña hasheada del usuario.                          |
| `rol`              | `VARCHAR`    | Rol del usuario (`admin`, `gerente`, `subgerente`, `operador`). |
| `empresa_rut`      | `VARCHAR`    | **(FK)** Apunta a `empresas.rut`.                         |
| `rut_personal`     | `VARCHAR`    | **(Nuevo)** RUT personal del usuario (debe ser único).    |
| `email_verificado` | `BOOLEAN`    | Indica si el usuario ha verificado su correo.             |

### 3. Tabla `proyectos`
Almacena los proyectos de construcción de cada empresa.

| Columna        | Tipo de Dato | Descripción                                               |
|----------------|--------------|-----------------------------------------------------------|
| `id_proyecto`  | `SERIAL`     | **(PK)** Identificador numérico único del proyecto.       |
| `nombre`       | `VARCHAR`    | Nombre del proyecto.                                      |
| `ubicacion`    | `TEXT`       | Dirección o descripción de la ubicación del proyecto.     |
| `latitud`      | `DECIMAL`    | Coordenada de latitud (geocodificación).                  |
| `longitud`     | `DECIMAL`    | Coordenada de longitud (geocodificación).                 |
| `fecha_inicio` | `DATE`       | Fecha de inicio del proyecto.                             |
| `fecha_fin`    | `DATE`       | Fecha de finalización del proyecto.                       |
| `empresa_rut`  | `VARCHAR`    | **(FK)** Apunta a `empresas.rut`.                         |

### 4. Tabla `residuos`
Registra cada residuo generado en los proyectos.

| Columna               | Tipo de Dato | Descripción                                               |
|-----------------------|--------------|-----------------------------------------------------------|
| `id_residuo`          | `SERIAL`     | **(PK)** Identificador numérico único del residuo.        |
| `tipo`                | `VARCHAR`    | Tipo de residuo (ej: "Hormigón", "Madera").               |
| `cantidad`            | `DECIMAL`    | Cantidad del residuo (siempre almacenada en `kg`).        |
| `unidad`              | `VARCHAR`    | Unidad de medida (siempre almacenada como `kg`).          |
| `reciclable`          | `BOOLEAN`    | `true` si el residuo es reciclable.                       |
| `estado`              | `VARCHAR`    | Estado actual del residuo (ej: "En obra", "Retirado").    |
| `id_proyecto`         | `INTEGER`    | **(FK)** Apunta a `proyectos.id_proyecto`.                |
| `id_usuario_creacion` | `INTEGER`    | **(Nuevo) (FK)** Apunta a `usuarios.id_usuario`.          |

### 5. Tabla `trazabilidad`
Guarda el historial de seguimiento de cada residuo.

| Columna           | Tipo de Dato | Descripción                                               |
|-------------------|--------------|-----------------------------------------------------------|
| `id_trazabilidad` | `SERIAL`     | **(PK)** Identificador único del registro de trazabilidad.|
| `id_residuo`      | `INTEGER`    | **(FK)** Apunta a `residuos.id_residuo`.                  |
| `qr`              | `TEXT`       | Contenido del código QR generado.                         |
| `ticket`          | `TEXT`       | Información del ticket o manifiesto de retiro.            |
| `fecha`           | `TIMESTAMP`  | Fecha y hora en que se registró este evento.              |

---

## Relaciones entre Tablas

- **Una Empresa tiene muchos Usuarios:** `empresas.rut` <--> `usuarios.empresa_rut`
- **Una Empresa tiene muchos Proyectos:** `empresas.rut` <--> `proyectos.empresa_rut`
- **Un Proyecto tiene muchos Residuos:** `proyectos.id_proyecto` <--> `residuos.id_proyecto`
- **Un Usuario crea muchos Residuos:** `usuarios.id_usuario` <--> `residuos.id_usuario_creacion`
- **Un Residuo tiene muchos eventos de Trazabilidad:** `residuos.id_residuo` <--> `trazabilidad.id_residuo`

---

## Análisis de Normalización

El esquema de la base de datos cumple con las primeras tres formas normales (3NF), lo que asegura una buena estructura, evita la redundancia de datos y previene anomalías de actualización.

- **Primera Forma Normal (1NF):** Cumplida. Todas las columnas contienen valores atómicos y cada registro es único gracias a su clave primaria. No hay grupos de repetición.

- **Segunda Forma Normal (2NF):** Cumplida. Dado que todas las tablas usan una clave primaria de una sola columna, no hay dependencias parciales posibles, por lo que se cumple automáticamente.

- **Tercera Forma Normal (3NF):** Cumplida. No existen dependencias transitivas. Por ejemplo, para saber el nombre de la empresa de un residuo, es necesario pasar por `proyectos` (`residuo` -> `proyecto` -> `empresa`). El nombre de la empresa no se almacena en la tabla `residuos`, lo que evita redundancia y posibles inconsistencias si el nombre de la empresa cambia. Lo mismo ocurre con el nombre del proyecto o el nombre del usuario creador.
