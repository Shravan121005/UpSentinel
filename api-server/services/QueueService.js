const { Queue } = require('bullmq');

const redisUrl = new URL(process.env.REDIS_URL || 'redis://redis:6379');
const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
};

// Create BullMQ Queue - same queue name as ping-worker
const monitoringQueue = new Queue('ping-jobs', {
  connection: redisConnection,
});

class QueueService {
  static async enqueueMonitoringJob(jobData) {
    try {
      // jobData should contain: monitorId, url, interval, region
      const job = await monitoringQueue.add('check-monitor', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      });

      console.log(`✓ Job enqueued: ${job.id}`);
      return job.id.toString();
    } catch (error) {
      console.error('✗ Error enqueuing job:', error);
      throw error;
    }
  }

  static async removeJob(jobId) {
    try {
      const job = await monitoringQueue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`✓ Job removed: ${jobId}`);
      }
    } catch (error) {
      console.error('✗ Error removing job:', error);
      throw error;
    }
  }

  static async getJobStatus(jobId) {
    try {
      const job = await monitoringQueue.getJob(jobId);
      if (!job) {
        return null;
      }
      return {
        id: job.id,
        state: await job.getState(),
        progress: job.progress(),
        data: job.data,
      };
    } catch (error) {
      console.error('✗ Error getting job status:', error);
      throw error;
    }
  }

  static async getQueueStats() {
    try {
      const counts = await monitoringQueue.getJobCounts();
      return counts;
    } catch (error) {
      console.error('✗ Error getting queue stats:', error);
      throw error;
    }
  }
}

module.exports = QueueService;
