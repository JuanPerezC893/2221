const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { wasteValidationRules, validateRequest } = require('../middleware/validators');
const { authMiddleware, authorize } = require('../middleware/auth');
const { crearEtiquetaPDF } = require('../services/pdfService');
const multer = require('multer'); // Importar multer
const { uploadFile } = require('../services/cloudinaryService'); // Importar el servicio de Cloudinary

// Configuración de Multer para almacenar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Ruta para subir un certificado de disposición final a un residuo
router.post('/:id/upload-certificate', authorize(['gestor', 'admin']), upload.single('certificate'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut, tipo_empresa } = req.user; // Extraer tipo_empresa de req.user

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });
  }

  // 1. Verificar que el residuo existe y no está en estado 'pendiente'
  //    También verificar que el usuario es de tipo 'gestora'
  const residuoCheck = await pool.query(
    `SELECT r.id_residuo
           FROM residuos r
           JOIN proyectos p ON r.id_proyecto = p.id_proyecto
           WHERE r.id_residuo = $1 AND LOWER(r.estado) = 'entregado' AND $2 = 'gestora'`,
          [id, tipo_empresa]
        );
        
        if (residuoCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Acceso denegado. El residuo no existe, no está en estado "entregado", o su rol no es de gestor.' });
        }  try {
    // 2. Subir el archivo a Cloudinary
    // Multer memoryStorage almacena el archivo en req.file.buffer
    // Pasamos el buffer directamente a Cloudinary junto con el mimetype
    const fileContent = req.file.buffer;
    const secure_url = await uploadFile(fileContent, req.file.mimetype);

    // 3. Actualizar la base de datos con la URL del certificado
    await pool.query(
      'UPDATE residuos SET url_certificado = $1 WHERE id_residuo = $2',
      [secure_url, id]
    );

    res.status(200).json({ message: 'Certificado subido exitosamente.', url_certificado: secure_url });

  } catch (error) {
    console.error('Error al subir el certificado:', error);
    res.status(500).json({ message: 'Error al subir el certificado.' });
  }
}));

// Ruta para que los gestores vean los residuos disponibles
router.get('/disponibles', asyncHandler(async (req, res) => {
  const { tipo_empresa } = req.user;
  const { tipo, ciudad, empresa, page = 1, limit = 9 } = req.query; // Capturar filtros y paginación

  if (tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado. Esta función es solo para gestores de residuos.' });
  }

  let queryParams = [];
  let whereClauses = ["LOWER(r.estado) = 'pendiente'"];

  if (tipo) {
    queryParams.push(tipo.toLowerCase());
    whereClauses.push(`LOWER(r.tipo) = $${queryParams.length}`);
  }
  if (ciudad) {
    queryParams.push(`%${ciudad.toLowerCase()}%`);
    whereClauses.push(`LOWER(p.ubicacion) LIKE $${queryParams.length}`);
  }
  if (empresa) {
    queryParams.push(`%${empresa.toLowerCase()}%`);
    whereClauses.push(`LOWER(e.razon_social) LIKE $${queryParams.length}`);
  }

  const whereCondition = whereClauses.join(' AND ');

  // Contar el total de residuos para la paginación
  const totalQuery = `SELECT COUNT(*) FROM residuos r JOIN proyectos p ON r.id_proyecto = p.id_proyecto JOIN empresas e ON p.empresa_rut = e.rut WHERE ${whereCondition}`;
  const totalResult = await pool.query(totalQuery, queryParams);
  const totalResiduos = parseInt(totalResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalResiduos / limit);

  // Consulta para obtener los residuos paginados
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      r.id_residuo,
      r.tipo,
      r.cantidad,
      r.unidad,
      r.reciclable,
      p.nombre AS nombre_proyecto,
      p.ubicacion AS ubicacion_proyecto,
      e.razon_social AS nombre_empresa_constructora
    FROM
      residuos r
    JOIN
      proyectos p ON r.id_proyecto = p.id_proyecto
    JOIN
      empresas e ON p.empresa_rut = e.rut
    WHERE
      ${whereCondition}
    ORDER BY
      r.id_residuo DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;

  const disponibles = await pool.query(query, [...queryParams, limit, offset]);

  res.json({
    residuos: disponibles.rows,
    totalPages,
    currentPage: parseInt(page, 10)
  });
}));

// Obtener el detalle de UN residuo pendiente (para GESTORES)
router.get('/detalle/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tipo_empresa } = req.user;

  if (tipo_empresa !== 'gestora') {
    return res.status(403).json({ message: 'Acceso denegado. Esta función es solo para gestores.' });
  }

  const query = `
    SELECT
      r.id_residuo,
      r.tipo,
      r.cantidad,
      r.unidad,
      r.reciclable,
      r.estado,
      r.url_certificado, -- Añadir url_certificado
      p.nombre AS nombre_proyecto,
      p.ubicacion AS ubicacion_proyecto,
      p.latitud,
      p.longitud,
      e.razon_social AS nombre_empresa_constructora
    FROM
      residuos r
    JOIN
      proyectos p ON r.id_proyecto = p.id_proyecto
    JOIN
      empresas e ON p.empresa_rut = e.rut
    WHERE
      r.id_residuo = $1 AND LOWER(r.estado) = 'pendiente'
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado o ya no está disponible.' });
  }

  res.json(result.rows[0]);
}));

// Función para convertir unidades a kilogramos
const convertToKg = (cantidad, unidad) => {
  const conversiones = {
    'kg': 1,
    'kilogramos': 1,
    'toneladas': 1000,
    'ton': 1000,
    't': 1000,
    'gramos': 0.001,
    'g': 0.001,
    'libras': 0.453592,
    'lb': 0.453592
  };
  
  const factor = conversiones[unidad.toLowerCase()] || 1;
  return cantidad * factor;
};

// Obtener todos los residuos (filtrado por proyecto o empresa)
router.get('/', asyncHandler(async (req, res) => {
  const { id_proyecto } = req.query;
  const { empresa_rut } = req.user; // Obtenido del token de autenticación

  let query;
  let params;

  if (id_proyecto) {
    // Verificar que el proyecto pertenece a la empresa del usuario
    const proyecto = await pool.query('SELECT 1 FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id_proyecto, empresa_rut]);
    if (proyecto.rows.length === 0) {
      return res.status(403).json({ message: 'Acceso denegado a este proyecto.' });
    }
    query = `
      SELECT r.*, p.nombre as nombre_proyecto, u.nombre AS nombre_creador
      FROM residuos r
      JOIN proyectos p ON r.id_proyecto = p.id_proyecto
      LEFT JOIN usuarios u ON r.id_usuario_creacion = u.id_usuario
      WHERE r.id_proyecto = $1
      ORDER BY r.id_residuo DESC
    `;
    params = [id_proyecto];
  } else {
    query = `
      SELECT r.*, p.nombre as nombre_proyecto, u.nombre AS nombre_creador
      FROM residuos r
      JOIN proyectos p ON r.id_proyecto = p.id_proyecto
      LEFT JOIN usuarios u ON r.id_usuario_creacion = u.id_usuario
      WHERE p.empresa_rut = $1
      ORDER BY r.id_residuo DESC
    `;
    params = [empresa_rut];
  }

  const residuos = await pool.query(query, params);
  res.json(residuos.rows);
}));

// Crear un nuevo residuo
router.post('/', authorize(['subgerente', 'operador']), wasteValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { tipo, cantidad, unidad, reciclable, id_proyecto } = req.body;
  const { empresa_rut, id: id_usuario_creacion } = req.user;

  // Verificar que el proyecto pertenece a la empresa del usuario
  const proyecto = await pool.query('SELECT 1 FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id_proyecto, empresa_rut]);
  if (proyecto.rows.length === 0) {
    return res.status(403).json({ message: 'No puede agregar residuos a un proyecto que no le pertenece.' });
  }

  // Generar un código de entrega de 6 dígitos
  const codigo_entrega = Math.floor(100000 + Math.random() * 900000).toString();

  // Convertir la cantidad a kilogramos y normalizar la unidad
  const cantidadOriginal = cantidad;
  const unidadOriginal = unidad;
  const cantidadEnKg = convertToKg(cantidad, unidad);
  
  // Guardar siempre en kg para consistencia en cálculos
  const unidadNormalizada = 'kg';

  const newResiduo = await pool.query(
    'INSERT INTO residuos (tipo, cantidad, unidad, reciclable, id_proyecto, id_usuario_creacion, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [tipo, cantidadEnKg, unidadNormalizada, reciclable, id_proyecto, id_usuario_creacion, 'pendiente']
  );
  
  // Agregar información sobre la conversión en la respuesta
  const resultado = {
    ...newResiduo.rows[0],
    conversion_info: {
      cantidad_original: cantidadOriginal,
      unidad_original: unidadOriginal,
      cantidad_convertida: cantidadEnKg,
      unidad_convertida: unidadNormalizada,
      message: unidadOriginal.toLowerCase() !== 'kg' ? 
        `Se convirtió ${cantidadOriginal} ${unidadOriginal} a ${cantidadEnKg} kg` : 
        'No se requirió conversión'
    }
  };
  
  res.status(201).json(resultado);
}));

// Obtener tipos de residuos distintos para la empresa
router.get('/types', asyncHandler(async (req, res) => {
    const { empresa_rut } = req.user;
    const result = await pool.query(
        `SELECT DISTINCT r.tipo 
         FROM residuos r
         JOIN proyectos p ON r.id_proyecto = p.id_proyecto
         WHERE p.empresa_rut = $1`,
        [empresa_rut]
    );
    res.json(result.rows.map(row => row.tipo));
}));

// Resumen de residuos por tipo (para un proyecto específico o toda la empresa)
router.get('/summary-by-type', asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const { empresa_rut } = req.user;

  let query;
  let params;

  if (projectId) {
    query = 'SELECT tipo, SUM(cantidad) AS total_cantidad FROM residuos WHERE id_proyecto = $1 GROUP BY tipo';
    params = [projectId];
  } else {
    query = `
      SELECT r.tipo, SUM(r.cantidad) AS total_cantidad
      FROM residuos r
      JOIN proyectos p ON r.id_proyecto = p.id_proyecto
      WHERE p.empresa_rut = $1
      GROUP BY r.tipo
    `;
    params = [empresa_rut];
  }

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

// Resumen de residuos a lo largo del tiempo (para un proyecto específico o toda la empresa)
router.get('/summary-over-time', asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const { empresa_rut } = req.user;

    let query;
    let params;

    if (projectId) {
        query = `
            SELECT TO_CHAR(t.fecha_evento, 'YYYY-MM') AS month, SUM(r.cantidad) AS total_cantidad 
            FROM residuos r 
            JOIN trazabilidad t ON r.id_residuo = t.id_residuo 
            WHERE r.id_proyecto = $1 
            GROUP BY month 
            ORDER BY month
        `;
        params = [projectId];
    } else {
        query = `
            SELECT COALESCE(TO_CHAR(t.fecha_evento, 'YYYY-MM'), 'Sin Fecha') AS month, SUM(r.cantidad) AS total_cantidad
            FROM residuos r
            LEFT JOIN trazabilidad t ON r.id_residuo = t.id_residuo
            JOIN proyectos p ON r.id_proyecto = p.id_proyecto
            WHERE p.empresa_rut = $1
            GROUP BY month
            ORDER BY month
        `;
        params = [empresa_rut];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
}));

// Impacto ambiental (para un proyecto específico o toda la empresa)
router.get('/environmental-impact', asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const { empresa_rut } = req.user;

    // Factores de emisión en kg de CO2e ahorrado por kg de material reciclado
    const EMISSION_FACTORS = {
        'Plásticos': 2.5,    // Ahorro por evitar producción virgen
        'Metales': 2.047,  // Ahorro muy alto por reciclaje de metales
        'Madera': 1.468,    // Incluye carbono secuestrado
        'Papel': 1.468,    // Similar a la madera
        'Cartón': 1.468,   // Similar a la madera
        'Hormigón': 0.1004, // Ahorro por reciclaje de agregados
        'Ladrillos': 0.1004,
        'Tierra': 0.1004,
        'Piedras': 0.1004,
        'Asfalto': 0.1004,
        'default': 0.1     // Un valor por defecto conservador para otros materiales
    };

    let recyclableQuery, totalQuery;
    let params;

    if (projectId) {
        params = [projectId];
        recyclableQuery = 'SELECT tipo, SUM(cantidad) AS total_reciclado_tipo FROM residuos WHERE reciclable = TRUE AND id_proyecto = $1 GROUP BY tipo';
        totalQuery = 'SELECT SUM(cantidad) AS total_residuos FROM residuos WHERE id_proyecto = $1';
    } else {
        params = [empresa_rut];
        recyclableQuery = `
            SELECT r.tipo, SUM(r.cantidad) AS total_reciclado_tipo
            FROM residuos r
            JOIN proyectos p ON r.id_proyecto = p.id_proyecto
            WHERE r.reciclable = TRUE AND p.empresa_rut = $1
            GROUP BY r.tipo
        `;
        totalQuery = `
            SELECT SUM(r.cantidad) AS total_residuos
            FROM residuos r
            JOIN proyectos p ON r.id_proyecto = p.id_proyecto
            WHERE p.empresa_rut = $1
        `;
    }
    
    const [recyclableResult, totalResult] = await Promise.all([
        pool.query(recyclableQuery, params),
        pool.query(totalQuery, params)
    ]);

    const recyclableRows = recyclableResult.rows || [];
    const total_residuos = parseFloat(totalResult.rows[0]?.total_residuos) || 0;

    let total_reciclado = 0;
    let co2Avoided = 0;

    recyclableRows.forEach(row => {
        const cantidad = parseFloat(row.total_reciclado_tipo);
        const factor = EMISSION_FACTORS[row.tipo] || EMISSION_FACTORS.default;
        co2Avoided += cantidad * factor;
        total_reciclado += cantidad;
    });

    const percentageDiverted = total_residuos > 0 ? ((total_reciclado / total_residuos) * 100).toFixed(2) : '0.00';

    res.json({ 
        co2Avoided: co2Avoided.toFixed(2),
        percentageDiverted 
    });
}));

// Últimos registros de residuos (para un proyecto específico o toda la empresa)
router.get('/latest', asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const { empresa_rut } = req.user;
    
    let query;
    let params;

    if (projectId) {
        query = 'SELECT id_residuo, tipo, cantidad, unidad, estado FROM residuos WHERE id_proyecto = $1 ORDER BY id_residuo DESC LIMIT 5';
        params = [projectId];
    } else {
        query = `
            SELECT r.id_residuo, r.tipo, r.cantidad, r.unidad, r.estado
            FROM residuos r
            JOIN proyectos p ON r.id_proyecto = p.id_proyecto
            WHERE p.empresa_rut = $1
            ORDER BY r.id_residuo DESC LIMIT 5
        `;
        params = [empresa_rut];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
}));

// Generar un PDF para la etiqueta de un residuo
router.get('/:id/etiqueta-pdf', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { empresa_rut } = req.user;

    // 1. Obtener datos del residuo y verificar pertenencia
    const residuoResult = await pool.query(
        `SELECT r.*, p.nombre as nombre_proyecto, e.razon_social as nombre_empresa
         FROM residuos r
         JOIN proyectos p ON r.id_proyecto = p.id_proyecto
         JOIN empresas e ON p.empresa_rut = e.rut
         WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
        [id, empresa_rut]
    );

    if (residuoResult.rows.length === 0) {
        return res.status(404).json({ message: 'Residuo no encontrado o no pertenece a su empresa.' });
    }
    const residuo = residuoResult.rows[0];

    // 2. Generar el PDF
    try {
        // El frontend URL es necesario para construir el enlace del QR
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const pdfBuffer = await crearEtiquetaPDF(residuo, frontendUrl);

        // 3. Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Etiqueta-Residuo-${id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al generar el PDF de la etiqueta:', error);
        res.status(500).json({ message: 'No se pudo generar la etiqueta en PDF.' });
    }
}));

// Marcar un residuo como "En Camino"
router.put('/:id/en-camino', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;
  const { destino } = req.body; // Capturar el destino desde el body

  if (!destino) {
    return res.status(400).json({ message: 'El destino es un campo requerido.' });
  }

  // Verificar que el residuo pertenece a la empresa del usuario y está en estado 'pendiente'
  const residuoCheck = await pool.query(
    `SELECT r.id_residuo 
     FROM residuos r
     JOIN proyectos p ON r.id_proyecto = p.id_proyecto
     WHERE r.id_residuo = $1 AND p.empresa_rut = $2 AND lower(r.estado) = 'pendiente'`,
    [id, empresa_rut]
  );

  if (residuoCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado, no pertenece a su empresa, o ya no está en estado "pendiente".' });
  }

  // Generar un nuevo código de 8 dígitos para el envío
  const nuevoCodigoEntrega = Math.floor(10000000 + Math.random() * 90000000).toString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Actualizar el estado y el código del residuo
    const updatedResiduoResult = await client.query(
      "UPDATE residuos SET estado = 'en camino', codigo_entrega = $1 WHERE id_residuo = $2 RETURNING *",
      [nuevoCodigoEntrega, id]
    );

    // 2. Registrar el evento de envío en la tabla de trazabilidad
    await client.query(
      'INSERT INTO trazabilidad (id_residuo, ticket, fecha_evento) VALUES ($1, $2, NOW())',
      [id, `Enviado a: ${destino}`]
    );

    await client.query('COMMIT');
    res.json(updatedResiduoResult.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de envío:', error);
    res.status(500).json({ message: 'Error al procesar el envío.' });
  } finally {
    client.release();
  }
}));

// Obtener un residuo por ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;

  const residuo = await pool.query(
    `SELECT r.* 
     FROM residuos r
     JOIN proyectos p ON r.id_proyecto = p.id_proyecto
     WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
    [id, empresa_rut]
  );

  if (residuo.rows.length === 0) {
    return res.status(404).json({ message: 'Residuo no encontrado o no pertenece a su empresa.' });
  }
  res.json(residuo.rows[0]);
}));

// Actualizar un residuo
router.put('/:id', authorize(['subgerente']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tipo, cantidad, unidad, reciclable, estado } = req.body;
  const { empresa_rut } = req.user;

  // Verificar que el residuo pertenece a la empresa del usuario
  const residuoCheck = await pool.query(
    `SELECT r.id_residuo 
     FROM residuos r
     JOIN proyectos p ON r.id_proyecto = p.id_proyecto
     WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
    [id, empresa_rut]
  );

  if (residuoCheck.rows.length === 0) {
    return res.status(403).json({ message: 'No puede actualizar un residuo que no le pertenece.' });
  }

  // Convertir la cantidad a kilogramos y normalizar la unidad
  const cantidadOriginal = cantidad;
  const unidadOriginal = unidad;
  const cantidadEnKg = convertToKg(cantidad, unidad);
  const unidadNormalizada = 'kg';

  const updatedResiduo = await pool.query(
    'UPDATE residuos SET tipo = $1, cantidad = $2, unidad = $3, reciclable = $4, estado = $5 WHERE id_residuo = $6 RETURNING *',
    [tipo, cantidadEnKg, unidadNormalizada, reciclable, estado, id]
  );
  
  // Agregar información sobre la conversión en la respuesta
  const resultado = {
    ...updatedResiduo.rows[0],
    conversion_info: {
      cantidad_original: cantidadOriginal,
      unidad_original: unidadOriginal,
      cantidad_convertida: cantidadEnKg,
      unidad_convertida: unidadNormalizada,
      message: unidadOriginal.toLowerCase() !== 'kg' ? 
        `Se convirtió ${cantidadOriginal} ${unidadOriginal} a ${cantidadEnKg} kg` : 
        'No se requirió conversión'
    }
  };
  
  res.json(resultado);
}));

// Eliminar un residuo
router.delete('/:id', authorize(['subgerente']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;

  // Opcional: Verificar que el residuo pertenece a la empresa del usuario antes de eliminar
  const residuoCheck = await pool.query(
    `SELECT r.id_residuo 
     FROM residuos r
     JOIN proyectos p ON r.id_proyecto = p.id_proyecto
     WHERE r.id_residuo = $1 AND p.empresa_rut = $2`,
    [id, empresa_rut]
  );

  if (residuoCheck.rows.length === 0) {
    return res.status(403).json({ message: 'No puede eliminar un residuo que no le pertenece.' });
  }
  
  // Eliminar trazabilidad asociada primero
  await pool.query('DELETE FROM trazabilidad WHERE id_residuo = $1', [id]);
  // Luego eliminar el residuo
  await pool.query('DELETE FROM residuos WHERE id_residuo = $1', [id]);
  
  res.status(200).json({ message: 'Residuo y su trazabilidad asociada eliminados correctamente.' });
}));

module.exports = router;
