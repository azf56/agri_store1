import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME || 'agri_store_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

// Determine if we should connect to MySQL or SQLite:
// In local dev environment without a dedicated MySQL instance, default to SQLite file persistence.
// If DB_DIALECT is explicitly 'mysql' and either password is set, host is non-local, FORCE_MYSQL is true, or in production, use MySQL.
const isMysqlConfigured =
  process.env.DB_DIALECT === 'mysql' &&
  (process.env.FORCE_MYSQL === 'true' ||
    (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') ||
    (isProduction && process.env.DB_PASSWORD !== undefined));

const dbDialect = isMysqlConfigured ? 'mysql' : (process.env.DB_DIALECT || 'sqlite');

// Ensure SQLite storage directory exists if used
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sequelize: Sequelize;

/**
 * Configure Sequelize connection.
 * Primary: MySQL with Connection Pooling (for cPanel / Cloud MySQL / VPS)
 * Standard Local: SQLite file-based database for immediate standalone local development and sandbox execution.
 */
if (dbDialect === 'mysql') {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: isProduction ? false : (msg) => console.log(`[SQL]: ${msg}`),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+03:30', // Iran Standard Time
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  });
} else {
  // SQLite configuration for development/testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dataDir, 'agri_store.sqlite'),
    logging: isProduction ? false : (msg) => console.log(`[SQLite]: ${msg}`),
    define: {
      timestamps: true,
      underscored: true,
    },
  });
}

export async function testConnection(): Promise<{ success: boolean; dialect: string; message: string }> {
  try {
    await sequelize.authenticate();
    const dialectName = sequelize.getDialect();
    console.log(`✅ [Database] Successfully connected to ${dialectName.toUpperCase()} database.`);
    return { success: true, dialect: dialectName, message: `Connected to ${dialectName.toUpperCase()}` };
  } catch (error: any) {
    console.error(`⚠️ [Database] Connection error on ${dbDialect}:`, error.message);
    return { success: false, dialect: dbDialect, message: error.message };
  }
}

export { sequelize };
export default sequelize;
