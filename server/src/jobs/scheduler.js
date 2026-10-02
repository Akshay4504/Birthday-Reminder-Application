import cron from 'node-cron';
import { runReminders } from '../services/reminderService.js';
import { env } from '../config/env.js';



let activeTask;

export const startScheduler = () => {
  const schedule = env.CRON_SCHEDULE || '30 8 * * *';
  
  activeTask = cron.schedule(schedule, async () => {
    console.log(`[Scheduler] Running email reminders at ${new Date().toISOString()}`);
    const counts = await runReminders();
    console.log(`[Scheduler] Finished: ${counts.checked} checked, ${counts.sent} sent, ${counts.skipped} skipped, ${counts.failed} failed.`);
  }, {
    timezone: 'Asia/Kolkata'
  });
  
  console.log(`[Scheduler] Started with schedule: ${schedule}`);
};

export const stopScheduler = () => {
  if (activeTask) {
    activeTask.stop();
    console.log('[Scheduler] Stopped.');
  }
};
