const MonitorService = require('../services/MonitorService');
const PingResult = require('../models/PingResult');
const { Queue } = require("bullmq");

const redisUrl = new URL(process.env.REDIS_URL || "redis://redis:6379");

const pingQueue = new Queue("ping-jobs", {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379
  }
});

class MonitorController {
  static async createMonitor(req, res) {
    try {
      const { url, interval, antiSleep } = req.body;
      const userId = req.userId;

      // Validation
      if (!url || !interval) {
        return res.status(400).json({
          success: false,
          message: 'URL and interval are required',
        });
      }

      const monitor = await MonitorService.createMonitor(
        userId,
        url,
        interval,
        antiSleep || false
      );

      await pingQueue.add(
        "ping",
        {
          monitorId: monitor._id,
          url: monitor.url
        },
        {
          repeat: {
            every: interval * 1000
          },
          jobId: `monitor-${monitor._id}`
        }
      );

      res.status(201).json({
        success: true,
        message: 'Monitor created successfully',
        data: monitor,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getMonitors(req, res) {
    try {
      const userId = req.userId;

      const monitors = await MonitorService.getMonitorsByUser(userId);

      res.status(200).json({
        success: true,
        message: 'Monitors retrieved successfully',
        data: monitors,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteMonitor(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      await MonitorService.deleteMonitor(id, userId);

      res.status(200).json({
        success: true,
        message: 'Monitor deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getMonitor(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const monitor = await MonitorService.getMonitorById(id, userId);

      res.status(200).json({
        success: true,
        message: 'Monitor retrieved successfully',
        data: monitor,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getMonitorHistory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);

      const monitor = await MonitorService.getMonitorById(id, userId);
      const history = await PingResult.find({ url: monitor.url })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        message: 'Monitor history retrieved successfully',
        data: history,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = MonitorController;
