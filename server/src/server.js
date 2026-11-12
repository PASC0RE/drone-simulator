import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}/api`);
});

const shutdown = async () => {
  console.log('Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
