const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { wasteValidationRules, validateRequest } = require('../middleware/validators');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

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
router.post('/', wasteValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { tipo, cantidad, unidad, reciclable, estado, id_proyecto } = req.body;
  const { empresa_rut, id: id_usuario_creacion } = req.user;

  // Verificar que el proyecto pertenece a la empresa del usuario
  const proyecto = await pool.query('SELECT 1 FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id_proyecto, empresa_rut]);
  if (proyecto.rows.length === 0) {
    return res.status(403).json({ message: 'No puede agregar residuos a un proyecto que no le pertenece.' });
  }

  // Convertir la cantidad a kilogramos y normalizar la unidad
  const cantidadOriginal = cantidad;
  const unidadOriginal = unidad;
  const cantidadEnKg = convertToKg(cantidad, unidad);
  
  // Guardar siempre en kg para consistencia en cálculos
  const unidadNormalizada = 'kg';

  const newResiduo = await pool.query(
    'INSERT INTO residuos (tipo, cantidad, unidad, reciclable, estado, id_proyecto, id_usuario_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [tipo, cantidadEnKg, unidadNormalizada, reciclable, estado, id_proyecto, id_usuario_creacion]
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
            SELECT TO_CHAR(t.fecha, 'YYYY-MM') AS month, SUM(r.cantidad) AS total_cantidad 
            FROM residuos r 
            JOIN trazabilidad t ON r.id_residuo = t.id_residuo 
            WHERE r.id_proyecto = $1 
            GROUP BY month 
            ORDER BY month
        `;
        params = [projectId];
    } else {
        query = `
            SELECT COALESCE(TO_CHAR(t.fecha, 'YYYY-MM'), 'Sin Fecha') AS month, SUM(r.cantidad) AS total_cantidad
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
router.put('/:id', asyncHandler(async (req, res) => {
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
router.delete('/:id', asyncHandler(async (req, res) => {
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


module.exports = router;