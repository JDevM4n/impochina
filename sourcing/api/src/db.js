// sourcing/api/src/db.js
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST || 'postgres',   // usa el nombre del servicio, no "localhost"
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'impochina',
  user: process.env.PGUSER || 'impochina',
  password: process.env.PGPASSWORD || 'impochina',
  max: 10,
  idleTimeoutMillis: 30000
});

// opcional: export default también, por si se importa así
export default pool;
