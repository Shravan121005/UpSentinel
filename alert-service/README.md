# UpSentinel Alert Service

A microservice that consumes critical alerts from Redis and sends notifications via email, Discord, and Slack.

## Overview

The Alert Service monitors the `alerts` Redis queue for critical events (like service outages) and sends notifications through multiple channels to ensure teams are notified immediately.

## Features

✅ Polls Redis queue for alert events
✅ Email notifications (SMTP with Nodemailer)
✅ Discord webhook integration
✅ Slack webhook integration
✅ Configurable notification channels
✅ Detailed alert logging
✅ Graceful shutdown handling

## Architecture

### Alert Flow

```
┌─────────────────────┐
│   Ping Worker       │
│   (Detects Down)    │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │Redis Queue   │
    │   "alerts"   │
    └──────┬───────┘
           │
           ↓
    ┌──────────────────────┐
    │ Alert Service        │
    │ (Polling)            │
    └──────┬───────────────┘
           │
      ┌────┼────┬────────┐
      │    │    │        │
      ↓    ↓    ↓        ↓
    ┌──┐ ┌──────┐ ┌────────┐
    │📧│ │🔵    │ │💬     │
    │Mail│Discord  Slack
    └──┘ └──────┘ └────────┘
```

### Alert Event Structure

```json
{
  "event": "CRITICAL_DOWN",
  "url": "https://example.com",
  "region": "asia",
  "failureCount": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Installation

1. **Navigate to service directory**
   ```bash
   cd alert-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

## Configuration

### Email Setup (Nodemailer)

Edit `.env`:
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@upsent.com
ALERT_EMAIL_RECIPIENTS=admin@example.com,team@example.com
```

**Gmail App Password Setup:**
1. Enable 2-factor authentication on Gmail
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `SMTP_PASS`

### Discord Setup

1. Create a Discord server (if not exists)
2. Create a webhook:
   - Go to Server Settings → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL
3. Add to `.env`:
   ```env
   ENABLE_DISCORD=true
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
   ```

### Slack Setup

1. Create or use existing Slack workspace
2. Create incoming webhook:
   - Go to https://api.slack.com/apps and create a new app
   - Enable "Incoming Webhooks"
   - Click "Add New Webhook to Workspace"
   - Copy the webhook URL
3. Add to `.env`:
   ```env
   ENABLE_SLACK=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### All Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ALERT_POLL_INTERVAL` | `5000` | How often to check queue (ms) |
| `ENABLE_EMAIL` | `false` | Enable email notifications |
| `ENABLE_DISCORD` | `false` | Enable Discord notifications |
| `ENABLE_SLACK` | `false` | Enable Slack notifications |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | - | SMTP username |
| `SMTP_PASS` | - | SMTP password |
| `SMTP_FROM` | `alerts@upsent.com` | Email from address |
| `ALERT_EMAIL_RECIPIENTS` | - | Comma-separated email list |
| `DISCORD_WEBHOOK_URL` | - | Discord webhook URL |
| `SLACK_WEBHOOK_URL` | - | Slack webhook URL |

## Running the Service

**Development (with auto-reload)**
```bash
npm run dev
```

**Production**
```bash
npm start
```

## How It Works

### 1. Polling Loop

The service continuously polls the Redis `alerts` queue every 5 seconds (configurable).

```javascript
// Every 5 seconds
const alert = await redisClient.rPop('alerts');
if (alert) {
  // Process alert
}
```

### 2. Alert Processing

When an alert is retrieved:
1. Parse JSON alert object
2. Log alert details to console
3. Send to enabled notification channels
4. Log results

### 3. Notification Channels

**Email (Nodemailer)**:
- Sends formatted HTML email
- Includes alert details, timestamp, severity
- Goes to configured recipient list

**Discord (Webhook)**:
- Sends embed message with color-coding
- Includes all alert details
- Professional formatting

**Slack (Webhook)**:
- Sends rich block message
- Uses proper Slack formatting
- Action-focused messaging

## File Structure

```
alert-service/
├── lib/
│   ├── redisClient.js       # Redis connection
│   ├── emailService.js      # Email logic
│   └── webhookService.js    # Discord & Slack logic
├── alertWorker.js           # Main service
├── package.json
├── .env.example
├── .gitignore
├── README.md                # Full documentation
└── QUICKSTART.md            # Quick start guide
```

## Console Logging Output

The service provides detailed logging:

```
Processing Alert:
   Event: CRITICAL_DOWN
   URL: https://example.com
   Region: asia
   Failures: 3 consecutive
   Timestamp: 1/15/2024, 10:30:00 AM

📧 Email sent successfully (Message ID: ...)
   Recipients: admin@example.com, team@example.com

🔵 Discord alert sent successfully

💬 Slack alert sent successfully

📊 Notification Summary:
   Email:   ✓ Sent
   Discord: ✓ Sent
   Slack:   ✓ Sent

✓ Alert processed successfully
```

## Testing Alerts

### Manual Test - Enqueue Alert to Redis

```bash
redis-cli

# Push a test alert
LPUSH alerts '{"event":"CRITICAL_DOWN","url":"https://example.com","region":"asia","failureCount":3,"timestamp":"2024-01-15T10:30:00.000Z"}'

# Check queue
LRANGE alerts 0 -1
```

Service will immediately consume and process it!

### With API + Worker

1. **API Server**: Create a monitor with invalid URL
   ```bash
   curl -X POST http://localhost:5000/monitors \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://invalid-domain-xyz.com","interval":60}'
   ```

2. **Ping Worker**: Will detect failure after 3 consecutive pings
3. **Alert Service**: Will consume alert and send notifications

## Monitoring Queue

Check Redis for pending alerts:

```bash
redis-cli

# List all alerts in queue
LRANGE alerts 0 -1

# Count alerts
LLEN alerts

# Clear alerts (debugging)
DEL alerts
```

## Error Handling

The service handles various failure scenarios:

- **Redis connection error**: Retries with exponential backoff
- **SMTP connection error**: Logs and continues, disables email
- **Webhook failure**: Logs error, continues processing
- **Invalid alert JSON**: Logs error, continues polling
- **Missing configuration**: Warns and disables channel

## Performance

**Throughput**:
- Processes ~100+ alerts per minute (depending on notification latency)
- Fast JSON parsing and Redis operations
- Network calls to webhooks/SMTP are non-blocking

**Memory**:
- Minimal memory footprint (~50MB)
- No in-memory queue accumulation

**Scaling**:
Multiple alert service instances can run in parallel:
```bash
# Terminal 1
npm start

# Terminal 2
npm start

# Terminal 3
npm start
```

All share the same Redis queue. Each alert processed by first service to retrieve it.

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` (Redis) | Redis not running | Start Redis: `docker run -d -p 6379:6379 redis` |
| `SMTP auth failed` | Invalid credentials | Check Gmail app password |
| `Discord 401` | Invalid webhook URL | Regenerate webhook in Discord |
| `Slack 401` | Invalid webhook URL | Regenerate webhook in Slack |
| `No notification channels enabled` | All disabled | Enable at least one in `.env` |
| `Emails not received` | SMTP issue | Check spam folder, verify settings |

## Email Notification Example

**Subject**: 🚨 UpSentinel Alert: CRITICAL_DOWN

**Body**:
```
Event: CRITICAL_DOWN
URL: https://example.com
Region: asia
Consecutive Failures: 3
Time: 1/15/2024, 10:30:00 AM

Please investigate this issue immediately.
```

## Discord Embed Example

```
Title: 🚨 UpSentinel Alert
Color: Red (#e74c3c)
Fields:
  Event: CRITICAL_DOWN
  Status: CRITICAL DOWN
  URL: https://example.com (with link)
  Region: asia
  Consecutive Failures: 3
  Timestamp: 1/15/2024, 10:30:00 AM
```

## Slack Message Example

```
Header: 🚨 UpSentinel Alert
Fields:
  Event: CRITICAL_DOWN
  Status: CRITICAL DOWN
  URL: https://example.com (with link)
  Region: asia
  Failures: 3 consecutive
  Time: 1/15/2024, 10:30:00 AM
  
Action: 🚨 ACTION REQUIRED - Please investigate immediately.
```

## Integration with Other Services

### From Ping Worker
Ping Worker pushes alerts to Redis:
```javascript
await redisClient.lPush('alerts', JSON.stringify(alertEvent));
```

### From API Server
API can manually trigger alerts:
```javascript
const Queue = require('bullmq').Queue;
const redisClient = require('redis').createClient();
await redisClient.lPush('alerts', JSON.stringify(alertEvent));
```

### Future: Alert Service API
Could add REST endpoints to:
- View recent alerts
- Configure alert rules
- Acknowledge alerts
- Set quiet hours

## Security Considerations

- Store credentials in `.env` (never in code)
- Use OAuth tokens for webhooks
- SMTP over TLS encryption
- Validate webhook events before processing
- Don't log sensitive data

## License

MIT

## Support

For issues:
1. Check `.env` configuration
2. Verify Redis connection
3. Check webhook URLs are valid
4. Review console logs for detailed error messages
5. Test SMTP connection separately if needed
