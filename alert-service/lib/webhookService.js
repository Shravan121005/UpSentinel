const axios = require('axios');

class WebhookService {
  /**
   * Send alert to Discord webhook
   * @param {Object} alertEvent - Alert event object
   * @returns {boolean} Success status
   */
  static async sendDiscordAlert(alertEvent) {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

      if (!webhookUrl) {
        console.warn('⚠️  Discord webhook URL not configured');
        return false;
      }

      const payload = {
        content: this.formatDiscordMessage(alertEvent),
        embeds: [
          {
            title: '🚨 UpSentinel Alert',
            color: 0xe74c3c,
            fields: [
              {
                name: 'Event',
                value: alertEvent.event,
                inline: true,
              },
              {
                name: 'Status',
                value: 'CRITICAL DOWN',
                inline: true,
              },
              {
                name: 'URL',
                value: `[${alertEvent.url}](${alertEvent.url})`,
                inline: false,
              },
              {
                name: 'Region',
                value: alertEvent.region || 'Unknown',
                inline: true,
              },
              {
                name: 'Consecutive Failures',
                value: `${alertEvent.failureCount || 3}`,
                inline: true,
              },
              {
                name: 'Timestamp',
                value: new Date(alertEvent.timestamp).toLocaleString(),
                inline: false,
              },
            ],
            footer: {
              text: 'UpSentinel Alert Service',
            },
          },
        ],
      };

      const response = await axios.post(webhookUrl, payload);

      if (response.status === 204) {
        console.log('🔵 Discord alert sent successfully');
        return true;
      }
    } catch (error) {
      console.error('✗ Error sending Discord alert:', error.message);
      return false;
    }
  }

  /**
   * Send alert to Slack webhook
   * @param {Object} alertEvent - Alert event object
   * @returns {boolean} Success status
   */
  static async sendSlackAlert(alertEvent) {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;

      if (!webhookUrl) {
        console.warn('⚠️  Slack webhook URL not configured');
        return false;
      }

      const payload = {
        text: this.formatSlackMessage(alertEvent),
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 UpSentinel Alert',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Event:*\n${alertEvent.event}`,
              },
              {
                type: 'mrkdwn',
                text: `*Status:*\nCRITICAL DOWN`,
              },
              {
                type: 'mrkdwn',
                text: `*URL:*\n<${alertEvent.url}|${alertEvent.url}>`,
              },
              {
                type: 'mrkdwn',
                text: `*Region:*\n${alertEvent.region || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Failures:*\n${alertEvent.failureCount || 3} consecutive`,
              },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date(alertEvent.timestamp).toLocaleString()}`,
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':rotating_light: *ACTION REQUIRED* - Please investigate this issue immediately.',
            },
          },
        ],
      };

      const response = await axios.post(webhookUrl, payload);

      if (response.status === 200) {
        console.log('💬 Slack alert sent successfully');
        return true;
      }
    } catch (error) {
      console.error('✗ Error sending Slack alert:', error.message);
      return false;
    }
  }

  /**
   * Format Discord message
   * @param {Object} alertEvent - Alert event object
   * @returns {string} Message content
   */
  static formatDiscordMessage(alertEvent) {
    return `🚨 **Website Down**: ${alertEvent.url}
**Event**: ${alertEvent.event}
**Region**: ${alertEvent.region || 'Unknown'}
**Failures**: ${alertEvent.failureCount || 3} consecutive`;
  }

  /**
   * Format Slack message
   * @param {Object} alertEvent - Alert event object
   * @returns {string} Message content
   */
  static formatSlackMessage(alertEvent) {
    return `🚨 Website Down: ${alertEvent.url} (${alertEvent.event})`;
  }

  /**
   * Send alert to all enabled webhook platforms
   * @param {Object} alertEvent - Alert event object
   * @returns {Object} Results for each platform
   */
  static async sendToAllWebhooks(alertEvent) {
    const results = {
      discord: false,
      slack: false,
    };

    if (process.env.ENABLE_DISCORD === 'true') {
      results.discord = await this.sendDiscordAlert(alertEvent);
    }

    if (process.env.ENABLE_SLACK === 'true') {
      results.slack = await this.sendSlackAlert(alertEvent);
    }

    return results;
  }
}

module.exports = WebhookService;
