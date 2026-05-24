import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { taskExecutorService } from '../taskExecutor.service.js';

let queue = null;
let useRedis = false;

// Attempt to initialize Redis-backed BullMQ queue
try {
  const connectionOpts = {
    host: env.redisHost || '127.0.0.1',
    port: env.redisPort || 6379,
    maxRetriesPerRequest: null,
  };

  queue = new Queue('automationTasks', {
    connection: connectionOpts,
  });
  useRedis = true;
  console.log('BullMQ Queue initialized successfully.');
} catch (error) {
  console.warn(
    'BullMQ Queue failed to initialize (no Redis). Falling back to in-memory async execution queue:',
    error.message
  );
}

// Fallback in-memory queue implementation
class InMemoryQueue {
  async add(name, data) {
    console.log(`[InMemoryQueue] Enqueuing job: ${name}`);
    setTimeout(async () => {
      try {
        console.log(`[InMemoryQueue] Processing job: ${name}`);
        if (name === 'whatsapp') {
          await taskExecutorService.execute({
            action: 'send_whatsapp_message',
            args: { contact: data.contact, message: data.message, browser: 'chrome' },
          });
        }
      } catch (err) {
        console.error(`[InMemoryQueue] Job ${name} failed:`, err.message);
      }
    }, 0);
    return { id: `in-memory-${Date.now()}` };
  }
}

export const automationQueue = useRedis ? queue : new InMemoryQueue();

// Start Redis worker if active
if (useRedis) {
  try {
    const worker = new Worker(
      'automationTasks',
      async (job) => {
        console.log(`[BullMQ Worker] Processing job ${job.id} - ${job.name}`);
        const { contact, message } = job.data;
        return await taskExecutorService.execute({
          action: 'send_whatsapp_message',
          args: { contact, message, browser: 'chrome' },
        });
      },
      {
        connection: {
          host: env.redisHost || '127.0.0.1',
          port: env.redisPort || 6379,
          maxRetriesPerRequest: null,
        },
      }
    );

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log('BullMQ Worker started.');
  } catch (err) {
    console.error('Failed to start BullMQ Worker:', err.message);
  }
}
