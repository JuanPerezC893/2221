
const express = require('express');
const router = express.Router();
const pool = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { projectValidationRules, validateRequest } = require('../middleware/validators');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { geocodeAddressWithFallbacks, getDefaultCoordinates } = require('../services/geocoding');
const { crearPDF } = require('../services/pdfService');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

// Obtener todos los proyectos de la empresa del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { empresa_rut } = req.user;
  const proyectos = await pool.query('SELECT * FROM proyectos WHERE empresa_rut = $1', [empresa_rut]);
  res.json(proyectos.rows);
}));

// Crear un nuevo proyecto
router.post('/', projectValidationRules(), validateRequest, asyncHandler(async (req, res) => {
  const { nombre, ubicacion, fecha_inicio, fecha_fin, descripcion } = req.body;
  const { empresa_rut } = req.user; // Usar el rut del rut de la empresa del token
  
  let latitud = null;
  let longitud = null;
  let geocoding_info = null;

  // Intentar geocodificar la ubicación automáticamente
  console.log(`🏗️  Creando proyecto "${nombre}" con ubicación: "${ubicacion}"`);
  
  try {
    const coordinates = await geocodeAddressWithFallbacks(ubicacion);
    
    if (coordinates) {
      latitud = coordinates.lat;
      longitud = coordinates.lon;
      geocoding_info = {
        status: 'success',
        display_name: coordinates.display_name,
        confidence: coordinates.confidence
      };
      console.log(`✅ Geocodificación exitosa para proyecto "${nombre}"`);
    } else {
      // Usar coordenadas por defecto si falla la geocodificación
      const defaultCoords = getDefaultCoordinates();
      latitud = defaultCoords.lat;
      longitud = defaultCoords.lon;
      geocoding_info = {
        status: 'fallback',
        message: 'No se pudieron obtener coordenadas específicas, usando ubicación por defecto',
        display_name: defaultCoords.display_name
      };
      console.log(`⚠️  Geocodificación falló para proyecto "${nombre}", usando coordenadas por defecto`);
    }
  } catch (error) {
    console.error('❌ Error durante geocodificación:', error.message);
    // Usar coordenadas por defecto en caso de error
    const defaultCoords = getDefaultCoordinates();
    latitud = defaultCoords.lat;
    longitud = defaultCoords.lon;
    geocoding_info = {
      status: 'error',
      message: 'Error durante geocodificación, usando ubicación por defecto',
      error: error.message
    };
  }

  const newProject = await pool.query(
    'INSERT INTO proyectos (nombre, ubicacion, latitud, longitud, fecha_inicio, fecha_fin, empresa_rut, descripcion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [nombre, ubicacion, latitud, longitud, fecha_inicio, fecha_fin, empresa_rut, descripcion]
  );
  
  // Añadir información de geocodificación a la respuesta
  const result = {
    ...newProject.rows[0],
    geocoding_info
  };
  
  res.status(201).json(result);
}));

// Obtener un proyecto por ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;
  const proyecto = await pool.query('SELECT * FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id, empresa_rut]);

  if (proyecto.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }
  res.json(proyecto.rows[0]);
}));

// Actualizar un proyecto
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, fecha_inicio, fecha_fin, descripcion } = req.body;
  const { empresa_rut } = req.user;

  let latitud = null;
  let longitud = null;
  let geocoding_info = null;

  // Obtener datos actuales del proyecto para comparar ubicación
  const currentProject = await pool.query(
    'SELECT ubicacion, latitud, longitud FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2',
    [id, empresa_rut]
  );

  if (currentProject.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }

  const currentData = currentProject.rows[0];
  
  // Solo geocodificar si la ubicación cambió
  if (ubicacion && ubicacion.trim() !== currentData.ubicacion?.trim()) {
    console.log(`🔄 Actualizando coordenadas para proyecto ID ${id}: "${currentData.ubicacion}" → "${ubicacion}"`);
    
    try {
      const coordinates = await geocodeAddressWithFallbacks(ubicacion);
      
      if (coordinates) {
        latitud = coordinates.lat;
        longitud = coordinates.lon;
        geocoding_info = {
          status: 'success',
          display_name: coordinates.display_name,
          confidence: coordinates.confidence,
          updated: true
        };
        console.log(`✅ Geocodificación exitosa para proyecto ID ${id}`);
      } else {
        // Mantener coordenadas existentes si falla la geocodificación
        latitud = currentData.latitud || getDefaultCoordinates().lat;
        longitud = currentData.longitud || getDefaultCoordinates().lon;
        geocoding_info = {
          status: 'fallback',
          message: 'No se pudieron obtener nuevas coordenadas, manteniendo las existentes',
          updated: false
        };
        console.log(`⚠️  Geocodificación falló para proyecto ID ${id}, manteniendo coordenadas existentes`);
      }
    } catch (error) {
      console.error('❌ Error durante geocodificación:', error.message);
      // Mantener coordenadas existentes en caso de error
      latitud = currentData.latitud || getDefaultCoordinates().lat;
      longitud = currentData.longitud || getDefaultCoordinates().lon;
      geocoding_info = {
        status: 'error',
        message: 'Error durante geocodificación, manteniendo coordenadas existentes',
        error: error.message,
        updated: false
      };
    }
  } else {
    // Ubicación no cambió, mantener coordenadas existentes
    latitud = currentData.latitud;
    longitud = currentData.longitud;
    geocoding_info = {
      status: 'unchanged',
      message: 'Ubicación no modificada, coordenadas sin cambios',
      updated: false
    };
  }

  const updatedProject = await pool.query(
    'UPDATE proyectos SET nombre = $1, ubicacion = $2, latitud = $3, longitud = $4, fecha_inicio = $5, fecha_fin = $6, descripcion = $7 WHERE id_proyecto = $8 AND empresa_rut = $9 RETURNING *',
    [nombre, ubicacion, latitud, longitud, fecha_inicio, fecha_fin, descripcion, id, empresa_rut]
  );

  if (updatedProject.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }
  
  // Añadir información de geocodificación a la respuesta
  const result = {
    ...updatedProject.rows[0],
    geocoding_info
  };
  
  res.json(result);
}));

// Eliminar un proyecto
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;

  // Primero, verificar que el proyecto pertenece a la empresa del usuario
  const proyecto = await pool.query('SELECT * FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id, empresa_rut]);

  if (proyecto.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }

  // La base de datos debería tener ON DELETE CASCADE para manejar la eliminación en cascada.
  // Si no, la lógica manual es necesaria, pero es menos eficiente.
  // Asumiendo que ON DELETE CASCADE está configurado en la DDL para `residuos` y `trazabilidad`.
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Eliminar la trazabilidad de los residuos asociados al proyecto
    await client.query(`
      DELETE FROM trazabilidad
      WHERE id_residuo IN (SELECT id_residuo FROM residuos WHERE id_proyecto = $1)
    `, [id]);

    // 2. Eliminar los residuos asociados al proyecto
    await client.query('DELETE FROM residuos WHERE id_proyecto = $1', [id]);

    // 3. Eliminar el proyecto
    const deleteProjectResult = await client.query('DELETE FROM proyectos WHERE id_proyecto = $1', [id]);

    if (deleteProjectResult.rowCount > 0) {
        await client.query('COMMIT');
        res.status(200).json({ message: 'Proyecto y todos sus datos asociados eliminados correctamente.' });
    } else {
        // Esto puede ocurrir si el proyecto fue eliminado en otra transacción
        await client.query('ROLLBACK');
        res.status(404).json({ message: 'El proyecto no pudo ser eliminado, puede que ya no exista.' });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en la transacción de eliminación:', error);
    res.status(500).json({ message: 'Error al eliminar el proyecto.' });
  } finally {
    client.release();
  }
}));

// Generar un informe en PDF para un proyecto
router.post('/:id/generar-informe', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empresa_rut } = req.user;

  // 1. Obtener datos del proyecto
  const proyectoResult = await pool.query('SELECT * FROM proyectos WHERE id_proyecto = $1 AND empresa_rut = $2', [id, empresa_rut]);

  if (proyectoResult.rows.length === 0) {
    return res.status(404).json({ message: 'Proyecto no encontrado o no pertenece a su empresa.' });
  }
  const proyecto = proyectoResult.rows[0];

  // 2. Obtener residuos del proyecto
  const residuosResult = await pool.query('SELECT * FROM residuos WHERE id_proyecto = $1', [id]);
  const residuos = residuosResult.rows;

  // 3. Generar el PDF
  try {
    const pdfBuffer = await crearPDF(proyecto, residuos);

    // 4. Enviar el PDF como respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=InformeFinal-Proyecto-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    res.status(500).json({ message: 'No se pudo generar el informe en PDF.' });
  }
}));

module.exports = router;
