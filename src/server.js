import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, redis } from './config/redis.js';
import { startDecayJob } from './jobs/decayJob.js';
import { startEmailWorker } from './jobs/emailWorker.js';
import app from './app.js';

async function main() {
  await connectDatabase();
  await connectRedis();

  startDecayJob();
  startEmailWorker();

  const server = app.listen(config.PORT, () => {
    console.log(`🚀 LeanStock API running on http://localhost:${config.PORT}/api/v1`);
    console.log(`📄 Swagger UI at http://localhost:${config.PORT}/api/docs`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      await redis.quit();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
