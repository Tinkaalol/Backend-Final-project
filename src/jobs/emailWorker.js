import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { sendEmailDirect } from '../services/email.service.js';


export function startEmailWorker() {
  const worker = new Worker('emails', async (job) => {
    console.log(`[EmailWorker] Processing job: ${job.name} → ${job.data.to}`);

    await sendEmailDirect({
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
    });

    console.log(`[EmailWorker] Sent: ${job.name} → ${job.data.to}`);
  }, {
    connection: redis,
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log(' Email worker started');
  return worker;
}
