# Alert Service - Quick Start

## Setup (5 minutes)

```bash
cd alert-service
npm install
cp .env.example .env
```

## Configure Notifications

Edit `.env`:

### Email (Optional)
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
ALERT_EMAIL_RECIPIENTS=admin@example.com
```

### Discord (Optional)
1. Create Discord webhook: Server Settings → Webhooks → New Webhook
2. Copy URL and add:
```env
ENABLE_DISCORD=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/URL
```

### Slack (Optional)
1. Create Slack webhook: https://api.slack.com/apps → Incoming Webhooks
2. Copy URL and add:
```env
ENABLE_SLACK=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

## Run Service

```bash
npm run dev
```

Expected output:
```
✓ Redis Client connected
✓ Redis Client ready

╔═══════════════════════════════════════╗
║  UpSentinel Alert Service             ║
║  Starting...                          ║
╚═══════════════════════════════════════╝

Configuration:
  Email:   ✓ Enabled
  Discord: ✓ Enabled
  Slack:   ✓ Enabled

╔═══════════════════════════════════════╗
║  Alert service ready                  ║
║  Polling queue: alerts                ║
║  Interval: 5000ms                     ║
╚═══════════════════════════════════════╝
```

## Test Alert

```bash
redis-cli

# Push test alert
LPUSH alerts '{"event":"CRITICAL_DOWN","url":"https://example.com","region":"asia","failureCount":3,"timestamp":"2024-01-15T10:30:00.000Z"}'
```

Service will immediately:
1. Consume alert from queue
2. Send email (if configured)
3. Send Discord message (if configured)
4. Send Slack message (if configured)
5. Log results to console

## Configuration Options

| Setting | Purpose |
|---------|---------|
| `ENABLE_EMAIL` | Activate email notifications |
| `ENABLE_DISCORD` | Activate Discord notifications |
| `ENABLE_SLACK` | Activate Slack notifications |
| `ALERT_POLL_INTERVAL` | Check queue every N milliseconds (default: 5000) |

## Console Output Example

```
Processing Alert

📬 Alert Event:
   Event: CRITICAL_DOWN
   URL: https://example.com
   Region: asia
   Failures: 3 consecutive
   Timestamp: 1/15/2024, 10:30:00 AM

📧 Email sent successfully
   Recipients: admin@example.com

🔵 Discord alert sent successfully

💬 Slack alert sent successfully

📊 Notification Summary:
   Email:   ✓ Sent
   Discord: ✓ Sent
   Slack:   ✓ Sent

✓ Alert processed successfully
```

## Supported Alerts

### CRITICAL_DOWN
When a service has 3 consecutive failed health checks:
```json
{
  "event": "CRITICAL_DOWN",
  "url": "https://example.com",
  "region": "asia",
  "failureCount": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Notification includes:
- ✓ Website URL with link
- ✓ Number of consecutive failures
- ✓ Region information
- ✓ Exact timestamp
- ✓ Call to action

## Email Recipients

Multiple emails separated by comma:
```env
ALERT_EMAIL_RECIPIENTS=admin@example.com,ops@example.com,cto@example.com
```

## Check Queue Status

```bash
redis-cli
LLEN alerts                 # Count alerts in queue
LRANGE alerts 0 -1         # View all alerts
```

## Files

- `alertWorker.js` - Main service entry point
- `lib/redisClient.js` - Redis connection
- `lib/emailService.js` - Email sending logic
- `lib/webhookService.js` - Discord & Slack logic

See [README.md](README.md) for full documentation.

## Gmail Setup (for Email)

1. Go to myaccount.google.com
2. Enable 2-Factor Authentication
3. Go to app passwords (https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy 16-character password
6. Use in SMTP_PASS

## Next Steps

1. Integrate with Ping Worker (already happens automatically!)
2. Create monitors in API Server
3. Ping Worker detects failures
4. Automatically sends alerts
5. Alert Service processes and notifies

## Scaling

Run multiple instances for high alert volume:

```bash
# Terminal 1
npm start

# Terminal 2
npm start

# Terminal 3
npm start
```

All consume from same `alerts` queue automatically.

## Key Features

✅ Polls Redis queue every 5 seconds
✅ Email via Nodemailer (SMTP)
✅ Discord embeds with colors
✅ Slack rich blocks
✅ Detailed console logging
✅ Graceful shutdown (Ctrl+C)
✅ No database required
✅ Stateless (scalable)

## Typical Workflow

```
1. User creates monitor
   API Server → Database
   
2. Ping Worker checks URL
   Every 60 seconds
   
3. 3 failures detected
   Ping Worker → Redis alerts queue
   
4. Alert Service polls queue
   Every 5 seconds
   
5. Notification sent
   → Email
   → Discord
   → Slack
   
6. Team notified immediately! ✓
```

See [README.md](README.md) for complete documentation.
