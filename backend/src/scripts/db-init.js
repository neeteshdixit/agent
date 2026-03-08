import { connectDb, pool } from '../config/db.js';

const run = async () => {
  await connectDb();
  console.log('Database schema initialized successfully.');
};

run()
  .catch((error) => {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
