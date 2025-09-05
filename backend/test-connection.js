// Script para probar la conexión con Neon PostgreSQL
require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    console.log('🔄 Probando conexión con Neon PostgreSQL...');
    
    // Probar conexión básica
    const client = await pool.connect();
    console.log('✅ Conexión establecida exitosamente');
    
    // Probar consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Tiempo actual:', result.rows[0].current_time);
    console.log('🐘 Versión PostgreSQL:', result.rows[0].pg_version.split(',')[0]);
    
    // Liberar cliente
    client.release();
    
    // Probar pool
    const poolResult = await pool.query('SELECT current_database() as db_name');
    console.log('🗄️ Base de datos actual:', poolResult.rows[0].db_name);
    
    console.log('🎉 Todas las pruebas pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    // Sugerencias basadas en errores comunes
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Sugerencia: Verifica que la URL de la base de datos sea correcta');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Sugerencia: Verifica el usuario y contraseña en la URL');
    } else if (error.message.includes('SSL')) {
      console.log('\n💡 Sugerencia: Asegúrate de que SSL esté configurado correctamente');
    }
  } finally {
    // Cerrar pool
    await pool.end();
    console.log('🔚 Conexión cerrada');
    process.exit();
  }
}

// Ejecutar prueba
testConnection();
