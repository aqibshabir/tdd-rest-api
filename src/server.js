import { app } from './app.js';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.POSTGRESQL_USER,
  host: process.env.POSTGRESQL_HOST,
  database:
    process.env.NODE_ENV === 'test' ? process.env.POSTGRESQL_TEST_DB : process.env.POSTGRESQL_DB,
  password: process.env.POSTGRESQL_PW,
  port: process.env.POSTGRESQL_PORT,
});

export const PORT = process.env.PORT;

export const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    await pool.end();
    server.close(() => {
      process.exit(0);
    });
  });
};

if (process.env.NODE_ENV === 'development') {
  startServer();
}
