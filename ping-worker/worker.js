require('dotenv').config();
const { Worker } = require('bullmq');
const { connectMongoDB, disconnectMongoDB } = require('./lib/mongoClient');
const redisClient = require('./lib/redisClient');
const PingService = require('./lib/pingService');

let worker;
let isShuttingDown = false;

/**
 * Initialize and start the worker
 */
const startWorker = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect Redis client
    await redisClient.connect();

    console.log(`
╔═══════════════════════════════════════╗
║  UpSentinel Ping Worker Service       ║
║  Starting...                          ║
╚═══════════════════════════════════════╝
    `);

    // Create BullMQ worker for ping-jobs queue
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY) || 10;
    
    const redisUrl = new URL(process.env.REDIS_URL || 'redis://redis:6379');
    worker = new Worker('ping-jobs', processJob, {
      connection: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port) || 6379,
      },
      concurrency,
    });

    // Worker event listeners
    worker.on('completed', (job) => {
      console.log(`✓ Job completed: ${job.id} - ${job.data.url}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`✗ Job failed: ${job.id} - ${err.message}`);
    });

    worker.on('error', (err) => {
      console.error('✗ Worker error:', err);
    });

    console.log(`
╔═══════════════════════════════════════╗
║  Worker initialized successfully      ║
║  Queue: ping-jobs                     ║
║  Concurrency: ${concurrency}                    ║
║  Processing jobs...                  ║
╚═══════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('✗ Failed to start worker:', error.message);
    process.exit(1);
  }
};

/**
 * Job processor function
 * Called by BullMQ for each job
 */
const processJob = async (job) => {
  return await PingService.processJob(job);
};

/**
 * Graceful shutdown handler
 */
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n⏹️  Shutting down worker gracefully...');

  try {
    // Close worker
    if (worker) {
      await worker.close();
      console.log('✓ Worker closed');
    }

    // Close Redis client
    await redisClient.quit();
    console.log('✓ Redis client closed');

    // Disconnect MongoDB
    await disconnectMongoDB();
    console.log('✓ MongoDB disconnected');

    console.log('✓ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the worker
startWorker();
