require('dotenv').config();
const redisClient = require('./lib/redisClient');
const EmailService = require('./lib/emailService');
const WebhookService = require('./lib/webhookService');

let isRunning = true;
let pollInterval = null;

/**
 * Initialize alert service
 */
const initializeService = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();

    // Initialize email if enabled
    if (process.env.ENABLE_EMAIL === 'true') {
      EmailService.initializeTransporter();
      const emailConnected = await EmailService.verifyConnection();
      if (!emailConnected) {
        console.warn('⚠️  Email disabled due to connection failure');
        process.env.ENABLE_EMAIL = 'false';
      }
    }

    console.log(`
╔═══════════════════════════════════════╗
║  UpSentinel Alert Service             ║
║  Starting...                          ║
╚═══════════════════════════════════════╝
    `);

    console.log(`
Configuration:
  Email:   ${process.env.ENABLE_EMAIL === 'true' ? '✓ Enabled' : '✗ Disabled'}
  Discord: ${process.env.ENABLE_DISCORD === 'true' ? '✓ Enabled' : '✗ Disabled'}
  Slack:   ${process.env.ENABLE_SLACK === 'true' ? '✓ Enabled' : '✗ Disabled'}
    `);

    if (process.env.ENABLE_EMAIL !== 'true' && 
        process.env.ENABLE_DISCORD !== 'true' && 
        process.env.ENABLE_SLACK !== 'true') {
      console.warn('⚠️  WARNING: No notification channels enabled!');
    }

    // Start polling for alerts
    startPolling();

    console.log(`
╔═══════════════════════════════════════╗
║  Alert service ready                  ║
║  Polling queue: alerts                ║
║  Interval: ${parseInt(process.env.ALERT_POLL_INTERVAL) || 5000}ms              ║
╚═══════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('✗ Failed to initialize service:', error.message);
    process.exit(1);
  }
};

/**
 * Start polling for alerts
 */
const startPolling = () => {
  const pollInterval = parseInt(process.env.ALERT_POLL_INTERVAL) || 5000;

  setInterval(async () => {
    if (!isRunning) return;

    try {
      // Try to get an alert from the Redis list
      const alertString = await redisClient.rPop('alerts');

      if (alertString) {
        const alertEvent = JSON.parse(alertString);
        await processAlert(alertEvent);
      }
    } catch (error) {
      console.error('✗ Error polling alerts:', error.message);
    }
  }, pollInterval);
};

/**
 * Process a single alert event
 * @param {Object} alertEvent - Alert event from queue
 */
const processAlert = async (alertEvent) => {
  try {
    console.log(`
╔═══════════════════════════════════════╗
║  Processing Alert                     ║
╚═══════════════════════════════════════╝
    `);

    console.log(`📬 Alert Event:`);
    console.log(`   Event: ${alertEvent.event}`);
    console.log(`   URL: ${alertEvent.url}`);
    console.log(`   Region: ${alertEvent.region || 'Unknown'}`);
    console.log(`   Failures: ${alertEvent.failureCount || 3} consecutive`);
    console.log(`   Timestamp: ${new Date(alertEvent.timestamp).toLocaleString()}`);
    console.log('');

    const notificationResults = {
      email: false,
      discord: false,
      slack: false,
    };

    // Send email notification
    if (process.env.ENABLE_EMAIL === 'true') {
      notificationResults.email = await EmailService.sendAlertEmail(alertEvent);
    }

    // Send webhook notifications
    const webhookResults = await WebhookService.sendToAllWebhooks(alertEvent);
    notificationResults.discord = webhookResults.discord;
    notificationResults.slack = webhookResults.slack;

    // Log summary
    console.log(`📊 Notification Summary:`);
    console.log(`   Email:   ${notificationResults.email ? '✓ Sent' : '✗ Skipped'}`);
    console.log(`   Discord: ${notificationResults.discord ? '✓ Sent' : '✗ Skipped'}`);
    console.log(`   Slack:   ${notificationResults.slack ? '✓ Sent' : '✗ Skipped'}`);
    console.log('');

    const anySent = notificationResults.email || notificationResults.discord || notificationResults.slack;
    if (anySent) {
      console.log('✓ Alert processed successfully\n');
    } else {
      console.warn('⚠️  No notification channels sent alert\n');
    }
  } catch (error) {
    console.error('✗ Error processing alert:', error.message);
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  isRunning = false;

  console.log('\n⏹️  Shutting down alert service gracefully...');

  try {
    // Close Redis connection
    await redisClient.quit();
    console.log('✓ Redis client closed');

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

// Start the service
initializeService();
