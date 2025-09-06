/**
 * Script de verificación para comprobar si los cambios de geocodificación
 * se aplicaron correctamente en Neon Postgres
 * 
 * Uso desde el directorio backend:
 * node utils/verify-database-changes.js
 */

const pool = require('../db');

const verifyDatabaseChanges = async () => {
  console.log('🔍 Verificando cambios en la base de datos Neon Postgres...\n');
  
  try {
    // Test 1: Verificar conexión a la base de datos
    console.log('1️⃣  Verificando conexión a Neon Postgres...');
    await pool.query('SELECT NOW() as current_time');
    console.log('   ✅ Conexión exitosa\n');

    // Test 2: Verificar existencia de la tabla proyectos
    console.log('2️⃣  Verificando tabla proyectos...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proyectos'
      ) as exists
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('   ✅ Tabla proyectos existe');
    } else {
      console.log('   ❌ Tabla proyectos NO existe');
      return;
    }

    // Test 3: Verificar columnas de coordenadas
    console.log('\n3️⃣  Verificando columnas de coordenadas...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'proyectos' 
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Estructura actual de la tabla proyectos:');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(not null)';
      const defaultVal = col.column_default ? ` default: ${col.column_default}` : '';
      console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });

    // Verificar específicamente latitud y longitud
    const latitudExists = columns.rows.find(col => col.column_name === 'latitud');
    const longitudExists = columns.rows.find(col => col.column_name === 'longitud');
    
    console.log('\n   🎯 Verificación de columnas específicas:');
    if (latitudExists) {
      console.log(`      ✅ latitud: ${latitudExists.data_type} (${latitudExists.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    } else {
      console.log('      ❌ latitud: NO EXISTE');
    }
    
    if (longitudExists) {
      console.log(`      ✅ longitud: ${longitudExists.data_type} (${longitudExists.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    } else {
      console.log('      ❌ longitud: NO EXISTE');
    }

    // Test 4: Verificar proyectos existentes
    console.log('\n4️⃣  Verificando proyectos existentes...');
    const proyectos = await pool.query(`
      SELECT COUNT(*) as total_proyectos,
             COUNT(latitud) as proyectos_con_latitud,
             COUNT(longitud) as proyectos_con_longitud
      FROM proyectos
    `);
    
    const stats = proyectos.rows[0];
    console.log(`   📊 Estadísticas de proyectos:`);
    console.log(`      - Total de proyectos: ${stats.total_proyectos}`);
    console.log(`      - Proyectos con latitud: ${stats.proyectos_con_latitud}`);
    console.log(`      - Proyectos con longitud: ${stats.proyectos_con_longitud}`);
    
    if (parseInt(stats.total_proyectos) > 0) {
      // Mostrar algunos proyectos de ejemplo
      const sampleProjects = await pool.query(`
        SELECT nombre, ubicacion, latitud, longitud 
        FROM proyectos 
        LIMIT 5
      `);
      
      console.log('\n   🏗️  Ejemplos de proyectos:');
      sampleProjects.rows.forEach((proyecto, index) => {
        const coords = proyecto.latitud && proyecto.longitud 
          ? `(${proyecto.latitud}, ${proyecto.longitud})` 
          : '(sin coordenadas)';
        console.log(`      ${index + 1}. ${proyecto.nombre}`);
        console.log(`         📍 ${proyecto.ubicacion} ${coords}`);
      });
    }

    // Test 5: Verificar integridad de datos
    console.log('\n5️⃣  Verificando integridad de coordenadas...');
    const integrityCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latitud IS NOT NULL AND longitud IS NULL THEN 1 END) as solo_latitud,
        COUNT(CASE WHEN latitud IS NULL AND longitud IS NOT NULL THEN 1 END) as solo_longitud,
        COUNT(CASE WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 1 END) as ambas_coordenadas,
        COUNT(CASE WHEN latitud IS NULL AND longitud IS NULL THEN 1 END) as sin_coordenadas
      FROM proyectos
    `);
    
    const integrity = integrityCheck.rows[0];
    console.log('   🔍 Análisis de integridad:');
    console.log(`      - Proyectos con ambas coordenadas: ${integrity.ambas_coordenadas}`);
    console.log(`      - Proyectos sin coordenadas: ${integrity.sin_coordenadas}`);
    console.log(`      - Solo latitud (inconsistente): ${integrity.solo_latitud}`);
    console.log(`      - Solo longitud (inconsistente): ${integrity.solo_longitud}`);
    
    if (parseInt(integrity.solo_latitud) > 0 || parseInt(integrity.solo_longitud) > 0) {
      console.log('      ⚠️  ADVERTENCIA: Hay proyectos con coordenadas inconsistentes');
    }

    // Test 6: Validar rangos de coordenadas
    if (parseInt(stats.proyectos_con_latitud) > 0) {
      console.log('\n6️⃣  Validando rangos de coordenadas...');
      const rangeCheck = await pool.query(`
        SELECT 
          MIN(latitud) as min_lat, MAX(latitud) as max_lat,
          MIN(longitud) as min_lon, MAX(longitud) as max_lon,
          COUNT(CASE WHEN latitud < -90 OR latitud > 90 THEN 1 END) as latitud_invalida,
          COUNT(CASE WHEN longitud < -180 OR longitud > 180 THEN 1 END) as longitud_invalida
        FROM proyectos 
        WHERE latitud IS NOT NULL AND longitud IS NOT NULL
      `);
      
      const ranges = rangeCheck.rows[0];
      console.log('   📐 Rangos de coordenadas:');
      console.log(`      - Latitud: ${ranges.min_lat} a ${ranges.max_lat}`);
      console.log(`      - Longitud: ${ranges.min_lon} a ${ranges.max_lon}`);
      
      if (parseInt(ranges.latitud_invalida) > 0) {
        console.log(`      ❌ ${ranges.latitud_invalida} coordenadas de latitud inválidas (fuera de -90 a 90)`);
      } else {
        console.log('      ✅ Todas las latitudes están en rango válido');
      }
      
      if (parseInt(ranges.longitud_invalida) > 0) {
        console.log(`      ❌ ${ranges.longitud_invalida} coordenadas de longitud inválidas (fuera de -180 a 180)`);
      } else {
        console.log('      ✅ Todas las longitudes están en rango válido');
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    const allChecks = {
      conexion: true,
      tabla_existe: tableExists.rows[0].exists,
      latitud_existe: !!latitudExists,
      longitud_existe: !!longitudExists,
      integridad_ok: parseInt(integrity.solo_latitud) === 0 && parseInt(integrity.solo_longitud) === 0
    };
    
    const allPassed = Object.values(allChecks).every(check => check === true);
    
    if (allPassed) {
      console.log('🎉 ¡TODOS LOS CAMBIOS SE APLICARON CORRECTAMENTE!');
      console.log('✅ La base de datos está lista para usar geocodificación automática');
    } else {
      console.log('❌ ALGUNOS CAMBIOS NO SE APLICARON CORRECTAMENTE:');
      Object.entries(allChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${check.replace('_', ' ')}`);
      });
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verifica tu conexión a internet');
      console.log('   - Revisa la configuración de DATABASE_URL');
      console.log('   - Asegúrate de que Neon Postgres esté activo');
    }
    
    process.exit(1);
  } finally {
    // Cerrar conexión
    await pool.end();
    console.log('\n🔌 Conexión cerrada');
  }
};

// Ejecutar verificación si este archivo se ejecuta directamente
if (require.main === module) {
  verifyDatabaseChanges();
}

module.exports = { verifyDatabaseChanges };
