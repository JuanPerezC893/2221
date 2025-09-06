/**
 * Script de migración para proyectos existentes
 * Este script puede ejecutarse para asignar coordenadas por defecto a proyectos que no las tienen
 * 
 * Uso desde el directorio backend:
 * node utils/migrate-existing-projects.js
 */

const pool = require('../db');

const migrateProjects = async () => {
  console.log('🔄 Iniciando migración de proyectos existentes...');
  
  try {
    // Verificar si las columnas de coordenadas existen
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proyectos' 
      AND column_name IN ('latitud', 'longitud')
    `);
    
    if (columnsCheck.rows.length < 2) {
      console.log('❌ Error: Las columnas latitud y longitud no existen en la tabla proyectos.');
      console.log('   Ejecuta primero el script: backend/migrations/add_coordinates_to_proyectos.sql');
      process.exit(1);
    }

    // Contar proyectos sin coordenadas
    const countResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM proyectos 
      WHERE latitud IS NULL OR longitud IS NULL
    `);
    
    const projectsToMigrate = parseInt(countResult.rows[0].count);
    
    if (projectsToMigrate === 0) {
      console.log('✅ No hay proyectos que requieran migración de coordenadas.');
      return;
    }

    console.log(`📊 Encontrados ${projectsToMigrate} proyectos sin coordenadas.`);
    console.log('🌎 Asignando coordenadas por defecto (Santiago, Chile: -33.4489, -70.6693)');

    // Asignar coordenadas por defecto a proyectos sin coordenadas
    const updateResult = await pool.query(`
      UPDATE proyectos 
      SET latitud = -33.4489, longitud = -70.6693 
      WHERE latitud IS NULL OR longitud IS NULL
    `);

    console.log(`✅ Migración completada: ${updateResult.rowCount} proyectos actualizados.`);
    console.log('💡 Los nuevos proyectos deberán incluir coordenadas específicas desde el formulario.');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Ejecutar migración si este archivo se ejecuta directamente
if (require.main === module) {
  migrateProjects();
}

module.exports = { migrateProjects };
