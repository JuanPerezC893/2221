/**
 * Script de verificación rápida para Neon Postgres
 * 
 * Uso: node utils/quick-check.js
 */

const pool = require('../db');

const quickCheck = async () => {
  console.log('🔍 Verificación rápida de Neon Postgres...\n');
  
  try {
    // 1. Test de conexión
    console.log('🔗 Probando conexión...');
    await pool.query('SELECT 1');
    console.log('✅ Conexión exitosa\n');
    
    // 2. Verificar columnas
    console.log('📋 Verificando estructura de tabla proyectos...');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'proyectos' 
      AND column_name IN ('latitud', 'longitud')
      ORDER BY column_name
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ Columnas latitud y longitud existen:');
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Faltan columnas de coordenadas:');
      console.log(`   Encontradas: ${result.rows.length}/2`);
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 3. Contar proyectos
    console.log('\n📊 Contando proyectos...');
    const count = await pool.query('SELECT COUNT(*) as total FROM proyectos');
    console.log(`✅ Total de proyectos: ${count.rows[0].total}`);
    
    console.log('\n🎉 ¡Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Verifica tu conexión y configuración de DATABASE_URL');
    }
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  quickCheck();
}
