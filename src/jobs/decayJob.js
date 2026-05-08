import cron from 'node-cron';
import { runDecayCycle, incrementDaysInInventory } from '../services/decay.service.js';
import { config } from '../config/env.js';

export function startDecayJob() {
  if (!config.CRON_DECAY_ENABLED) {
    console.log('[Cron] Decay job is disabled (CRON_DECAY_ENABLED=false)');
    return;
  }

  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily daysInInventory increment...');
    try {
      await incrementDaysInInventory();
    } catch (err) {
      console.error('[Cron] Daily tick failed:', err.message);
    }
  });

  cron.schedule('0 0 */3 * *', async () => {
    console.log('[Cron] Running dead stock decay cycle...');
    try {
      const result = await runDecayCycle('CRON');
      console.log(`[Cron] Decay cycle done: ${result.productsUpdated} products updated`);
    } catch (err) {
      console.error('[Cron] Decay cycle failed:', err.message);
    }
  });

  console.log(' Decay cron jobs scheduled (daily tick + 72h decay cycle)');
}
