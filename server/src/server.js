import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { verifyEmailConnection } from './utils/email.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await verifyEmailConnection();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('[Server] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start();
