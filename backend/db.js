const { Pool } = require('pg');

// Configuración para Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Configuración adicional para Neon
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Event listeners para debugging
pool.on('connect', (client) => {
  console.log('Nueva conexión establecida con la base de datos');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente inactivo', err);
});

module.exports = pool;
