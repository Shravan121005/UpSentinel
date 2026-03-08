const axios = require('axios');
const redisClient = require('./redisClient');
const PingResult = require('./PingResult');

class PingService {
  /**
   * Perform a ping to the given URL
   * @param {string} url - URL to ping
   * @param {string} region - Region identifier
   * @returns {Object} Ping result object
   */
  static async pingURL(url, region = 'unknown') {
    const startTime = Date.now();

    try {
      // Send HTTP GET request with timeout
      const response = await axios.get(url, {
        timeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
        validateStatus: () => true, // Don't throw on any status code
      });

      const latency = Date.now() - startTime;

      // Determine status based on response code
      const status = response.status >= 200 && response.status < 300 ? 'UP' : 'DOWN';

      const result = {
        url,
        status,
        statusCode: response.status,
        latency,
        region,
        errorMessage: null,
      };

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      // Handle various error types
      let errorMessage = 'Unknown error';

      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timeout';
      } else if (error.message === 'timeout of ' + (process.env.REQUEST_TIMEOUT || 10000) + 'ms exceeded') {
        errorMessage = 'Request timeout';
      } else {
        errorMessage = error.message;
      }

      const result = {
        url,
        status: 'DOWN',
        statusCode: null,
        latency,
        region,
        errorMessage,
      };

      return result;
    }
  }

  /**
   * Record ping result in MongoDB
   * @param {Object} pingResult - Ping result object
   * @returns {Object} Saved document
   */
  static async recordResult(pingResult) {
    try {
      const result = new PingResult(pingResult);
      await result.save();
      return result;
    } catch (error) {
      console.error('✗ Error recording ping result:', error.message);
      throw error;
    }
  }

  /**
   * Get failure counter for a URL
   * @param {string} url - URL to check
   * @returns {number} Current failure count
   */
  static async getFailureCounter(url) {
    try {
      const key = `failure:${url}`;
      const count = await redisClient.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('✗ Error getting failure counter:', error.message);
      return 0;
    }
  }

  /**
   * Increment failure counter for a URL
   * @param {string} url - URL to update
   * @returns {number} New counter value
   */
  static async incrementFailureCounter(url) {
    try {
      const key = `failure:${url}`;
      const newCount = await redisClient.incr(key);
      // Set expiry to 24 hours
      await redisClient.expire(key, 86400);
      return newCount;
    } catch (error) {
      console.error('✗ Error incrementing failure counter:', error.message);
      return 0;
    }
  }

  /**
   * Reset failure counter for a URL
   * @param {string} url - URL to reset
   * @returns {boolean} Success status
   */
  static async resetFailureCounter(url) {
    try {
      const key = `failure:${url}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('✗ Error resetting failure counter:', error.message);
      return false;
    }
  }

  /**
   * Push alert event to alerts queue
   * @param {Object} alertEvent - Alert event object
   * @returns {boolean} Success status
   */
  static async pushAlert(alertEvent) {
    try {
      const alertKey = 'alerts';
      const alertString = JSON.stringify(alertEvent);
      await redisClient.lPush(alertKey, alertString);
      
      console.log(
        `⚠️  ALERT: ${alertEvent.event} for ${alertEvent.url}`
      );
      
      return true;
    } catch (error) {
      console.error('✗ Error pushing alert:', error.message);
      return false;
    }
  }

  /**
   * Process a single ping job
   * @param {Object} job - BullMQ job object
   * @returns {Object} Job result
   */
  static async processJob(job) {
    const { url, interval, region } = job.data;

    try {
      console.log(`📍 Processing ping for ${url} in region ${region}`);

      // Perform the ping
      const pingResult = await this.pingURL(url, region);

      // Record result in MongoDB
      await this.recordResult(pingResult);

      // Handle failure detection logic
      if (pingResult.status === 'DOWN') {
        const failureCount = await this.incrementFailureCounter(url);
        console.log(`⚠️  Ping failed for ${url} (${failureCount}/3 failures)`);

        // Check if we've reached the alert threshold
        if (failureCount >= 3) {
          const alertEvent = {
            event: 'CRITICAL_DOWN',
            url,
            region,
            failureCount,
            timestamp: new Date(),
          };

          await this.pushAlert(alertEvent);
        }
      } else {
        // Reset counter on successful ping
        await this.resetFailureCounter(url);
      }

      return {
        success: true,
        message: `Ping completed: ${url} is ${pingResult.status}`,
        result: pingResult,
      };
    } catch (error) {
      console.error(`✗ Error processing job for ${url}:`, error.message);
      return {
        success: false,
        message: `Error processing ping for ${url}`,
        error: error.message,
      };
    }
  }
}

module.exports = PingService;
