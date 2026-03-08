# Ping Worker - Quick Start

## Setup (2 minutes)

```bash
cd ping-worker
npm install
cp .env.example .env
```

## Start Services

### MongoDB
```bash
docker run -d -p 27017:27017 mongo
```

### Redis
```bash
docker run -d -p 6379:6379 redis
```

## Run Worker

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
║  Starting...                          ║
╚═══════════════════════════════════════╝

╔═══════════════════════════════════════╗
║  Worker initialized successfully      ║
║  Queue: ping-jobs                     ║
║  Concurrency: 10                      ║
║  Processing jobs...                  ║
╚═══════════════════════════════════════╝
```

## How It Works

1. **Worker listens** to `ping-jobs` Redis queue
2. **Receives jobs** with: `{ url, interval, region }`
3. **Pings the URL** - checks if it responds
4. **Records result** in MongoDB (status, latency, etc.)
5. **Tracks failures** with Redis counter
6. **Pushes alerts** to `alerts` queue when 3 failures occur

## Enqueue a Job (from API)

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('ping-jobs', {
  connection: { host: 'localhost', port: 6379 },
});

await queue.add('check-monitor', {
  url: 'https://google.com',
  interval: 60,
  region: 'asia',
});
```

## Check Results

```bash
# Connect to MongoDB
mongosh

# View all ping results
use upsent
db.pingresults.find().pretty()

# View specific URL
db.pingresults.find({ url: "https://google.com" }).pretty()
```

## View Alerts

```bash
# Connect to Redis
redis-cli

# Get all alerts
LRANGE alerts 0 -1
```

## Configuration

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/upsent
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=10          # More jobs running in parallel
REQUEST_TIMEOUT=10000          # 10 second HTTP timeout
NODE_ENV=development
```

## Scaling

Run multiple workers for more throughput:
```bash
npm run dev  # Terminal 1
npm run dev  # Terminal 2
npm run dev  # Terminal 3
```

All share the same queue automatically.

## Key Features

✅ Concurrent job processing (default 10 jobs at once)
✅ Automatic failure detection after 3 consecutive failures
✅ HTTP GET health checks with latency measurement
✅ MongoDB result persistence
✅ Redis-based failure counters
✅ Alert generation to Redis queue
✅ Graceful shutdown (Ctrl+C)

## Job Payload

```javascript
{
  url: string,          // URL to ping: "https://example.com"
  interval: number,     // Interval in seconds: 60
  region: string        // Region: "asia"
}
```

## Ping Result Schema

Stored in MongoDB `pingresults`:
```javascript
{
  url: "https://example.com",
  status: "UP" | "DOWN",
  statusCode: 200 | null,
  latency: 125,                    // milliseconds
  region: "asia",
  errorMessage: null | "string",
  timestamp: Date
}
```

## Alert Payload

Pushed to Redis `alerts` queue:
```javascript
{
  event: "CRITICAL_DOWN",
  url: "https://example.com",
  region: "asia",
  failureCount: 3,
  timestamp: Date
}
```

## Logs

Example output:
```
📍 Processing ping for https://google.com in region asia
✓ Job completed: 1 - https://google.com
```

Errors:
```
⚠️  Ping failed for https://example.com (1/3 failures)
⚠️  ALERT: CRITICAL_DOWN for https://example.com
✗ Job failed: 1 - Error message
```

## Next Steps

1. Make sure API server is also running
2. Let API create monitors (which enqueue jobs)
3. Worker will automatically process them
4. Check MongoDB for results
5. Set up alert listener service

## Files

- `worker.js` - Main worker entry point
- `lib/pingService.js` - Ping logic, failure detection, alerts
- `lib/redisClient.js` - Redis connection
- `lib/mongoClient.js` - MongoDB connection
- `lib/PingResult.js` - Mongoose schema

See [README.md](README.md) for full documentation.
