import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agenda_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
  } : undefined
});

export default pool;
