import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';


export const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}
