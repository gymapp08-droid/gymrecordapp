import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { WorkerService } from './modules/queue/services/worker.service';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');
  logger.log('Starting ALPHA Dedicated Background Worker Process...');

  // Create standalone Nest application context without HTTP listener
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const workerService = appContext.get(WorkerService);
  workerService.start(1000);

  logger.log('ALPHA Background Worker listening for jobs on all queues.');

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down worker gracefully...`);
    workerService.stop();
    await appContext.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrapWorker().catch((err) => {
  console.error('Fatal error in worker process:', err);
  process.exit(1);
});
