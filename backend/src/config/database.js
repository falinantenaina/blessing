import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_vagues',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test de la connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à MySQL réussie');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
    process.exit(1);
  }
};

export { pool, testConnection };
