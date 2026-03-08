const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  /**
   * Initialize SMTP transporter
   */
  static initializeTransporter() {
    if (this.transporter) {
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✓ Email transporter initialized');
  }

  /**
   * Verify SMTP connection
   */
  static async verifyConnection() {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }
      await this.transporter.verify();
      console.log('✓ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('✗ SMTP verification failed:', error.message);
      return false;
    }
  }

  /**
   * Send alert email
   * @param {Object} alertEvent - Alert event object
   * @returns {boolean} Success status
   */
  static async sendAlertEmail(alertEvent) {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const recipients = (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').map((r) => r.trim());

      if (recipients.length === 0 || !recipients[0]) {
        console.warn('⚠️  No email recipients configured');
        return false;
      }

      const emailContent = this.formatAlertEmail(alertEvent);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'alerts@upsent.com',
        to: recipients.join(', '),
        subject: `🚨 UpSentinel Alert: ${alertEvent.event}`,
        html: emailContent,
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log(`📧 Email sent successfully (Message ID: ${result.messageId})`);
      console.log(`   Recipients: ${recipients.join(', ')}`);

      return true;
    } catch (error) {
      console.error('✗ Error sending email:', error.message);
      return false;
    }
  }

  /**
   * Format alert email HTML
   * @param {Object} alertEvent - Alert event object
   * @returns {string} HTML content
   */
  static formatAlertEmail(alertEvent) {
    const timestamp = new Date(alertEvent.timestamp).toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
            .header h2 { color: #e74c3c; margin: 0; }
            .alert-details { background-color: #fef5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
            .detail-row { display: flex; margin: 8px 0; }
            .label { font-weight: bold; color: #2c3e50; width: 120px; }
            .value { color: #555; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 UpSentinel Alert</h2>
            </div>
            
            <p>An alert has been triggered. Details:</p>
            
            <div class="alert-details">
              <div class="detail-row">
                <span class="label">Event:</span>
                <span class="value">${alertEvent.event}</span>
              </div>
              <div class="detail-row">
                <span class="label">URL:</span>
                <span class="value"><a href="${alertEvent.url}" target="_blank">${alertEvent.url}</a></span>
              </div>
              <div class="detail-row">
                <span class="label">Region:</span>
                <span class="value">${alertEvent.region || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Failures:</span>
                <span class="value">${alertEvent.failureCount || 3} consecutive</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${timestamp}</span>
              </div>
            </div>

            <p>Please investigate this issue immediately.</p>

            <div class="footer">
              <p>This is an automated alert from UpSentinel. Do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = EmailService;
