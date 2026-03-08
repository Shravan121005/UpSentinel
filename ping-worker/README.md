# UpSentinel Ping Worker

A stateless, concurrent microservice that performs health checks (pings) on monitored URLs and records results in MongoDB.

## Overview

The Ping Worker consumes jobs from a Redis queue, performs HTTP health checks on specified URLs, measures latency, detects failures, and triggers alerts when services become critically unavailable.

## Features

✅ Concurrent job processing (configurable concurrency)
✅ HTTP health checks with latency measurement
✅ MongoDB result logging
✅ Smart failure detection using Redis counters
✅ Automatic alert generation on critical failures
✅ Graceful shutdown handling
✅ Redis-based state management
✅ Comprehensive error handling

## Architecture

### Job Flow

```
┌─────────────────┐
│  Redis Queue    │
│   ping-jobs     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  BullMQ Worker  │
│  (Concurrent)   │
└────────┬────────┘
         │
         ├─→ Ping URL (HTTP GET)
         │
         ├─→ Measure Latency
         │
         ├─→ Record in MongoDB
         │
         ├─→ Check Failure Counter
         │
         └─→ Push Alert (if critical)
              └─→ Redis Queue: alerts
```

### Job Structure

Each job in the `ping-jobs` queue contains:
```json
{
  "url": "https://example.com",
  "interval": 60,
  "region": "asia"
}
```

### Ping Result Document

Recorded in MongoDB `pingresults` collection:
```javascript
{
  _id: ObjectId,
  url: "https://example.com",
  status: "UP" | "DOWN",
  statusCode: 200,
  latency: 125,
  region: "asia",
  errorMessage: null,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Alert Event

Pushed to `alerts` Redis queue:
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

1. **Navigate to worker directory**
   ```bash
   cd ping-worker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
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

## Prerequisites

### MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Redis
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

## Running the Worker

**Development (with auto-reload)**
```bash
npm run dev
```

**Production**
```bash
npm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/upsent` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `REDIS_HOST` | `localhost` | Redis host for BullMQ |
| `REDIS_PORT` | `6379` | Redis port for BullMQ |
| `WORKER_CONCURRENCY` | `10` | Number of concurrent jobs |
| `REQUEST_TIMEOUT` | `10000` | HTTP request timeout (ms) |
| `NODE_ENV` | `development` | Environment |

## How It Works

### 1. Job Processing
```javascript
// Example: Worker receives a job
{
  url: "https://google.com",
  interval: 60,
  region: "asia"
}
```

### 2. Health Check
- Sends HTTP GET request with configurable timeout
- Returns status UP (2xx) or DOWN (any other status or error)
- Measures response latency in milliseconds

### 3. Failure Detection
```
Success    → Reset failure counter to 0
           → Continue monitoring

Failure 1  → Increment counter (1/3)
           → Log warning

Failure 2  → Increment counter (2/3)
           → Log warning

Failure 3  → Increment counter (3/3)
           → PUSH ALERT TO alerts QUEUE
           → Log critical alert
```

### 4. Alert Generation
When a URL reaches 3 consecutive failures:
```json
{
  "event": "CRITICAL_DOWN",
  "url": "https://example.com",
  "region": "asia",
  "failureCount": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

This alert is pushed to the `alerts` Redis queue for downstream processing.

## API / Service Integration

### Enqueuing a Job

From API or other services, push jobs to the queue:

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('ping-jobs', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// Add a job
await queue.add('check-monitor', {
  url: 'https://example.com',
  interval: 60,
  region: 'asia',
});
```

### Consuming Alerts

From alert service or consumer:

```javascript
const redisClient = require('redis').createClient();
await redisClient.connect();

// Poll alerts queue
setInterval(async () => {
  const alert = await redisClient.rPop('alerts');
  if (alert) {
    const alertEvent = JSON.parse(alert);
    console.log('Alert received:', alertEvent);
    // Process alert (send email, SMS, etc.)
  }
}, 5000);
```

## File Structure

```
ping-worker/
├── lib/
│   ├── redisClient.js       # Redis connection
│   ├── mongoClient.js       # MongoDB connection
│   ├── PingResult.js        # Mongoose model
│   └── pingService.js       # Ping logic & failure detection
├── worker.js                # Main worker process
├── package.json
├── .env.example
└── README.md
```

## Error Handling

The worker handles various error scenarios:

- **Connection refused** - Server is down
- **Domain not found** - Invalid domain
- **Request timeout** - Server not responding within timeout
- **Network errors** - Connection issues
- **5xx errors** - Server errors
- **Non-2xx responses** - Treated as DOWN

## Logging

The worker logs:
- Job processing start/completion
- Ping results (UP/DOWN)
- Failure counter increments
- Alert generation
- Errors and exceptions

## Performance Considerations

1. **Concurrency**: Configure `WORKER_CONCURRENCY` based on:
   - Number of monitors
   - HTTP timeout value
   - Available system resources

   Example: 1000 monitors with 60s interval + 10s timeout
   - Recommended concurrency: 10-20

2. **MongoDB**: Create indexes for efficient queries
   - Compound index on `(url, timestamp)`
   - Index on `timestamp` for cleanup queries

3. **Redis Memory**: Failure counters
   - 24-hour expiry to prevent memory buildup
   - ~100 bytes per counter

4. **Network**: Multiple workers can be scaled horizontally
   - Each worker connects to the same Redis queue
   - Load automatically distributed

## Scaling

Run multiple worker instances:

```bash
# Worker 1
npm start

# Worker 2 (in another terminal/server)
npm start

# Worker 3 (in another terminal/server)
npm start
```

All workers consume from the same `ping-jobs` queue. BullMQ automatically distributes jobs.

## Database Cleanup

To clean old ping results:

```javascript
const { connectMongoDB } = require('./lib/mongoClient');
const PingResult = require('./lib/PingResult');

await connectMongoDB();

// Delete results older than 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await PingResult.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
```

## Monitoring & Debugging

### Check Queue Stats

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('ping-jobs', {
  connection: { host: 'localhost', port: 6379 },
});

const counts = await queue.getJobCounts();
console.log(counts);
// Output: { active: 5, completed: 1000, failed: 2, delayed: 0, ... }
```

### View Recent Alerts

```bash
redis-cli
> LRANGE alerts 0 -1
```

### Check Failure Counters

```bash
redis-cli
> KEYS failure:*
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` (Redis) | Redis not running | Start Redis: `docker run -d -p 6379:6379 redis` |
| `Connection refused` (MongoDB) | MongoDB not running | Start MongoDB: `docker run -d -p 27017:27017 mongo` |
| `Jobs not processing` | Worker not consuming queue | Check `REDIS_HOST` and `REDIS_PORT` match job enqueueing service |
| `High memory usage` | Too many failure counters | Failure counters auto-expire after 24 hours |

## License

MIT

## Contributing

Contributions welcome. Please ensure:
- Jobs complete successfully
- No MongoDB connection leaks
- Graceful shutdown works
- Error handling is robust
