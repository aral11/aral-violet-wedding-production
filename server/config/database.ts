import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || '127.0.0.1',
  database: process.env.DB_DATABASE || 'db',
  port: parseInt(process.env.DB_PORT || '1433'),
  user: process.env.DB_USER || 'aral21',
  password: process.env.DB_PASSWORD || 'Aral@1234',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to SQL Server database');
  }
  return pool;
}

export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

export { sql };
