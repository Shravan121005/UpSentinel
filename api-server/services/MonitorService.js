const Monitor = require('../models/Monitor');
const QueueService = require('./QueueService');

class MonitorService {
  static async createMonitor(userId, url, interval, antiSleep = false) {
    // Create monitor
    const monitor = new Monitor({
      userId,
      url,
      interval,
      antiSleep,
    });

    await monitor.save();

    // Push job to queue
    const jobId = await QueueService.enqueueMonitoringJob({
      monitorId: monitor._id.toString(),
      url,
      interval,
      region: 'asia', // Default region
    });

    // Update monitor with jobId
    monitor.jobId = jobId;
    await monitor.save();

    return monitor;
  }

  static async getMonitorsByUser(userId) {
    return await Monitor.find({ userId }).sort({ createdAt: -1 });
  }

  static async deleteMonitor(monitorId, userId) {
    // Verify ownership
    const monitor = await Monitor.findOne({ _id: monitorId, userId });
    if (!monitor) {
      throw new Error('Monitor not found or unauthorized');
    }

    // Remove from queue
    if (monitor.jobId) {
      await QueueService.removeJob(monitor.jobId);
    }

    // Delete monitor
    await Monitor.deleteOne({ _id: monitorId });

    return { message: 'Monitor deleted successfully' };
  }

  static async getMonitorById(monitorId, userId) {
    const monitor = await Monitor.findOne({ _id: monitorId, userId });
    if (!monitor) {
      throw new Error('Monitor not found or unauthorized');
    }
    return monitor;
  }
}

module.exports = MonitorService;
