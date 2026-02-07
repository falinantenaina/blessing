// database.js
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

// Validation des variables d'environnement obligatoires
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  console.error(
    "Variables d'environnement manquantes :",
    missingVars.join(", ")
  );
  console.error("Veuillez vérifier votre fichier .env");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Paramètres de connexion recommandés pour une application en production
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  queueLimit: 0,
  connectTimeout: 10000,           // 10 secondes max pour se connecter
  idleTimeout: 60000,              // Ferme les connexions inactives après 60s
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Très utile en développement pour voir les requêtes
  // (à désactiver ou commenter en production)
  // debug: process.env.NODE_ENV === "development",
  
  // Formatage automatique des dates (optionnel mais souvent utile)
  dateStrings: true,
  
  // Support des BigInt si vous avez des colonnes BIGINT
  supportBigNumbers: true,
  bigNumberStrings: true,
});

// Fonction de test de connexion améliorée
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Petit test de requête simple
    const [rows] = await connection.query("SELECT VERSION() as version");

  } catch (error) {
    
    if (error.code) {
      console.error("Code d'erreur MySQL :", error.code);
    }
    if (error.errno) {
      console.error("Numéro d'erreur :", error.errno);
    }
    
    // Codes d'erreur MySQL courants
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("→ Problème d'identifiants (user/password)");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("→ La base de données n'existe pas");
    } else if (error.code === "ECONNREFUSED") {
      console.error("→ Le serveur MySQL n'est pas accessible (port/host)");
    }
    
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

// Exécuter le test au démarrage (optionnel mais très recommandé)
if (process.env.NODE_ENV !== "test") {
  testConnection();
}

export { pool, testConnection };