import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';
import { runReminders } from './services/reminderService.js';

const startServer = async () => {
const server = app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
  
  startScheduler();
  
  console.log('[Startup] Running initial reminder check...');
  const counts = await runReminders();
  console.log(`[Startup] Finished: ${counts.checked} checked, ${counts.sent} sent, ${counts.skipped} skipped, ${counts.failed} failed.`);
};

startServer();

const shutdown = async () => {
  console.log('\n[Shutdown] Initiating graceful shutdown...');
  server.close(() => console.log('[Shutdown] HTTP server closed.'));
  stopScheduler();
  await pool.end();
  console.log('[Shutdown] Database pool closed. Exiting.');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
