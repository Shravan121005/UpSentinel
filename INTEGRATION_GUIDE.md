# UpSentinel - System Integration Guide

Complete guide for running and integrating all microservices.

## System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       UpSentinel Platform                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  API Server    Ping Worker    Alert Service    External Services       │
│  ┌──────────┐  ┌──────────┐   ┌────────────┐                          │
│  │ Auth     │  │ Health   │   │ Email/     │   ┌──────────────┐        │
│  │ Monitors │◄─│ Checks   │◄──│ Discord/   │──▶│ Gmail SMTP   │        │
│  │ CRUD     │  │ Latency  │   │ Slack      │   │ Discord API │        │
│  └────┬─────┘  └────┬─────┘   └────────────┘   │ Slack API   │        │
│       │             │                          └──────────────┘        │
│       └─────┬───────┘                                                  │
│             │                                                          │
│      ┌──────────────────┐                                              │
│      │   Redis Queues   │                                              │
│      │ • ping-jobs      │                                              │
│      │ • alerts         │                                              │
│      │ • failure        │                                              │
│      │   counters       │                                              │
│      └────────┬─────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│      ┌──────────────┐                                                  │
│      │   MongoDB    │                                                  │
│      │ • Users      │                                                  │
│      │ • Monitors   │                                                  │
│      │ • Results    │                                                  │
│      └──────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Complete Setup Instructions

### Phase 1: Prerequisites (5 minutes)

**1. Install Docker**
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

**2. Start Databases**

```bash
# Start MongoDB
docker run -d \
  --name upsent-mongodb \
  -p 27017:27017 \
  mongo:latest

# Start Redis
docker run -d \
  --name upsent-redis \
  -p 6379:6379 \
  redis:latest

# Verify
docker ps
```

You should see both containers running.

### Phase 2: API Server Setup (5 minutes)

**1. Navigate and Install**

```bash
cd api-server
npm install
```

**2. Configure Environment**

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/upsent
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_key_change_in_production
PORT=5000
NODE_ENV=development
```

**3. Start Server**

```bash
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully

╔════════════════════════════════════╗
║  Sentinels API Server              ║
║  Running on port 5000              ║
╚════════════════════════════════════╝
```

Server is now running at `http://localhost:5000`

### Phase 3: Ping Worker Setup (5 minutes)

**1. Navigate and Install**

```bash
cd ../ping-worker
npm install
```

**2. Configure Environment**

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/upsent
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
WORKER_CONCURRENCY=10
REQUEST_TIMEOUT=10000
NODE_ENV=development
```

**3. Start Worker**

```bash
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
✓ Redis Client connected
✓ Redis Client ready

╔═══════════════════════════════════════╗
║  UpSentinel Ping Worker Service       ║
║  Worker initialized successfully      ║
║  Queue: ping-jobs                     ║
║  Concurrency: 10                      ║
║  Processing jobs...                   ║
╚═══════════════════════════════════════╝
```

Worker is now listening to the queue!

### Phase 4: Alert Service Setup (5 minutes)

**1. Navigate and Install**

```bash
cd ../alert-service
npm install
```

**2. Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` to enable notification channels:

```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Enable at least one notification channel:
ENABLE_EMAIL=false          # Set to true + configure SMTP for email
ENABLE_DISCORD=false        # Set to true + add webhook URL
ENABLE_SLACK=false          # Set to true + add webhook URL

# Email example (Gmail):
# ENABLE_EMAIL=true
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# ALERT_EMAIL_RECIPIENTS=admin@example.com

# Discord example:
# ENABLE_DISCORD=true
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Slack example:
# ENABLE_SLACK=true
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**3. Start Service**

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
  Email:   ✗ Disabled
  Discord: ✗ Disabled
  Slack:   ✗ Disabled

╔═══════════════════════════════════════╗
║  Alert service ready                  ║
║  Polling queue: alerts                ║
║  Interval: 5000ms                     ║
╚═══════════════════════════════════════╝
```

Alert Service is now listening to the alerts queue!

## Testing the Integration

### Step 1: Create User Account

```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

**Save the token!** You'll need it for the next steps.

### Step 2: Create a Monitor

Replace `TOKEN` with the JWT token from step 1.

```bash
curl -X POST http://localhost:5000/monitors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "interval": 60,
    "antiSleep": false
  }'
```

Response:
```json
{
  "success": true,
  "message": "Monitor created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "url": "https://google.com",
    "interval": 60,
    "antiSleep": false,
    "status": "active",
    "jobId": "1",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Check Worker Terminal!** You should see:
```
📍 Processing ping for https://google.com in region asia
✓ Job completed: 1 - https://google.com
```

### Step 3: Check Ping Results in MongoDB

```bash
mongosh

# Connect to database
use upsent

# View all ping results
db.pingresults.find().pretty()

# View specific URL results
db.pingresults.find({ url: "https://google.com" }).pretty()
```

You should see results like:
```javascript
{
  _id: ObjectId("..."),
  url: "https://google.com",
  status: "UP",
  statusCode: 200,
  latency: 125,
  region: "asia",
  errorMessage: null,
  timestamp: ISODate("2024-01-15T10:30:00.000Z")
}
```

### Step 4: Get Your Monitors

```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/monitors
```

Response:
```json
{
  "success": true,
  "message": "Monitors retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "url": "https://google.com",
      "interval": 60,
      "status": "active",
      "jobId": "1"
    }
  ]
}
```

### Step 5: Delete a Monitor

```bash
curl -X DELETE http://localhost:5000/monitors/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer TOKEN"
```

**Check Worker Terminal!** The job will be removed from the queue.

## Data Flow Example

### Complete Workflow

```
1. User signs up
   POST /auth/signup
        ↓
   ✓ User stored in MongoDB

2. User creates monitor
   POST /monitors
        ↓
   ✓ Monitor stored in MongoDB
   ✓ Job pushed to ping-jobs queue
        ↓
3. Worker consumes job
   Reads: { url, interval, region }
        ↓
4. Worker pings URL
   HTTP GET https://google.com
        ↓
5. Worker measures latency
   Response: 125ms, Status: 200
        ↓
6. Worker stores result
   MongoDB: PingResult document
        ↓
7. Worker tracks failure
   Redis: failure:google.com counter
        ↓
8. (If 3 failures) Push alert
   Redis queue: alerts
        ↓
   ✓ System ready for next job
```

## Monitoring System Health

### 1. Check API Server

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "success": true,
  "message": "Sentinels API is running"
}
```

### 2. Check MongoDB

```bash
mongosh admin --eval "db.adminCommand('ping')"
```

### 3. Check Redis

```bash
redis-cli ping
```

### 4. Check Queue Status

```bash
redis-cli

# View ping-jobs queue
LLEN ping-jobs

# View alerts queue
LLEN alerts

# View failure counters
KEYS failure:*
```

### 5. View Worker Logs

Check the worker terminal where you ran `npm run dev`

## Advanced Operations

### Add Multiple Monitors

```bash
#!/bin/bash
TOKEN="your_token_here"

urls=(
  "https://google.com"
  "https://github.com"
  "https://stackoverflow.com"
  "https://nodejs.org"
)

for url in "${urls[@]}"; do
  curl -X POST http://localhost:5000/monitors \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"$url\",
      \"interval\": 60,
      \"antiSleep\": false
    }"
  
  sleep 1
done
```

### Query Ping Results

```javascript
// Find all results for a URL
db.pingresults.find({ url: "https://google.com" })

// Find last 10 results
db.pingresults.find().sort({ timestamp: -1 }).limit(10)

// Find DOWN status
db.pingresults.find({ url: "https://example.com", status: "DOWN" })

// Find high latency (> 1000ms)
db.pingresults.find({ url: "https://google.com", latency: { $gt: 1000 } })

// Get average latency
db.pingresults.aggregate([
  { $match: { url: "https://google.com" } },
  { $group: { _id: "$url", avgLatency: { $avg: "$latency" } } }
])

// Get stats for last 24 hours
db.pingresults.aggregate([
  { 
    $match: { 
      timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
    } 
  },
  { 
    $group: { 
      _id: "$url", 
      count: { $sum: 1 },
      upCount: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
      downCount: { $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] } }
    } 
  }
])
```

### Scale Worker Concurrency

Edit `ping-worker/.env`:
```env
WORKER_CONCURRENCY=20        # Process 20 jobs in parallel
```

Restart worker:
```bash
npm run dev
```

### Run Multiple Worker Instances

**Terminal 1 (API):**
```bash
cd api-server && npm run dev
```

**Terminal 2 (Worker 1):**
```bash
cd ping-worker && npm run dev
```

**Terminal 3 (Worker 2):**
```bash
cd ping-worker && npm run dev
```

**Terminal 4 (Worker 3):**
```bash
cd ping-worker && npm run dev
```

All workers process the same queue. Jobs are automatically distributed!

## Database Cleanup

Remove old ping results (older than 30 days):

```bash
mongosh

use upsent

// Delete results older than 30 days
db.pingresults.deleteMany({
  createdAt: {
    $lt: new Date(Date.now() - 30*24*60*60*1000)
  }
})

// Create TTL index (auto-delete after 30 days)
db.pingresults.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 }
)
```

## Stopping Services

**API Server**: `Ctrl+C` in API terminal

**Worker**: `Ctrl+C` in Worker terminal

**Databases**:
```bash
docker stop upsent-mongodb upsent-redis
```

**Remove Containers** (and data):
```bash
docker rm -f upsent-mongodb upsent-redis
```

## Troubleshooting

### MongoDB connection error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB
```bash
docker run -d -p 27017:27017 mongo
```

### Redis connection error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Start Redis
```bash
docker run -d -p 6379:6379 redis
```

### No jobs being processed

1. Check worker is running: See console output in worker terminal
2. Check Redis connection: `redis-cli ping`
3. Check queue has jobs: `redis-cli LLEN ping-jobs`

### Jobs piled up in queue

1. Increase worker concurrency in `.env`
2. Run more worker instances
3. Check MongoDB is responsive: `mongosh`

### Cannot login

1. Make sure you signed up first
2. Check email/password are correct
3. Check API server is running on port 5000

## Performance Tips

1. **Worker Concurrency**: Start with 10, increase to 20-50 based on CPU
2. **Request Timeout**: Set to 10-15 seconds (URL response time + buffer)
3. **Database Indexes**: Already configured for efficient queries
4. **Redis Memory**: Failure counters auto-expire after 24 hours
5. **Data Retention**: Clean old results regularly

## Security Checklist

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Don't commit `.env` files (use `.env.example`)
- [ ] Use HTTPS in production
- [ ] Set MongoDB authentication
- [ ] Set Redis password
- [ ] Validate user input (already done in controllers)
- [ ] Rate limit API endpoints (implement in production)
- [ ] Use CORS properly (configured in server.js)

## Next Steps

1. **Alert Handler**: Build service to consume `alerts` queue and notify users
2. **Dashboard**: Create UI to display uptime statistics
3. **Webhook**: Send alerts to external systems (Slack, PagerDuty, etc.)
4. **Analytics**: Generate uptime reports
5. **Team Management**: Add role-based access control

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Guide](https://expressjs.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Axios Documentation](https://axios-http.com/)

---

**Happy Monitoring! 🚀**

For detailed service documentation, see:
- [API Server README](api-server/README.md)
- [Ping Worker README](ping-worker/README.md)
- [System Architecture](ARCHITECTURE.md)
