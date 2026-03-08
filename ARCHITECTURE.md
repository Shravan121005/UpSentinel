# UpSentinel - Distributed Uptime Monitoring Platform

A scalable, production-ready microservice-based platform for monitoring website uptime and performance.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          UpSentinel System                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │   API Server     │  │   Ping Worker     │  │  Alert Service      │  │
│  │  (api-server/)   │  │  (ping-worker/)   │  │ (alert-service/)    │  │
│  ├──────────────────┤  ├───────────────────┤  ├─────────────────────┤  │
│  │ • User Auth      │  │ • HTTP GET Checks │  │ • Email (SMTP)      │  │
│  │ • Monitor CRUD   │  │ • Latency Measure │  │ • Discord Webhooks  │  │
│  │ • Job Enqueue    │◄─│ • Failure Track   │◄─│ • Slack Webhooks    │  │
│  │ • JWT Auth       │  │ • Alert Push      │  │ • Alert Polling     │  │
│  └────────┬─────────┘  └───────┬───────────┘  └──────────────┬─────┘  │
│           │                    │                              │         │
│           │  ping-jobs queue   │     alerts queue            │         │
│           └────────┬───────────┘──────────────┬──────────────┘         │
│                    │                          │                        │
│                    ▼                          ▼                        │
│           ┌──────────────────┐      ┌─────────────────┐               │
│           │    Redis         │      │  Email Servers  │               │
│           │  • Queues        │      │  • SMTP (Gmail) │               │
│           │  • Counters      │      │  • Discord      │               │
│           │  • Alerts        │      │  • Slack        │               │
│           └──────────────────┘      └─────────────────┘               │
│                    │                                                   │
│                    ▼                                                   │
│           ┌──────────────────┐                                         │
│           │    MongoDB       │                                         │
│           │  • Users         │                                         │
│           │  • Monitors      │                                         │
│           │  • Ping Results  │                                         │
│           └──────────────────┘                                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Services

### 1. API Server (api-server/)
**Purpose**: User and monitor management, job scheduling

- **User Authentication**: JWT-based signup/login
- **Monitor Configuration**: Create, read, delete monitoring configurations
- **Job Enqueuing**: Automatically pushes monitoring jobs to Redis queue
- **Database**: MongoDB users and monitor configurations

**Tech Stack**:
- Node.js + Express.js
- MongoDB with Mongoose
- BullMQ for queue management
- JWT for authentication
- bcryptjs for password hashing

**Key Endpoints**:
```
POST   /auth/signup              Register user
POST   /auth/login               Login user
POST   /monitors                 Create monitor
GET    /monitors                 List user's monitors
GET    /monitors/:id             Get monitor details
DELETE /monitors/:id             Delete monitor
```

### 2. Ping Worker (ping-worker/)
**Purpose**: Perform health checks on monitored URLs

- **Health Checks**: Sends HTTP GET requests to URLs
- **Latency Measurement**: Records response time
- **Result Logging**: Stores results in MongoDB
- **Failure Detection**: Tracks consecutive failures with Redis counter
- **Alert Generation**: Pushes alerts when failure threshold reached
- **Concurrent Processing**: Handles multiple URLs in parallel

**Tech Stack**:
- Node.js
- BullMQ for queue consumption
- Axios for HTTP requests
- MongoDB for result persistence
- Redis for failure counters

**Job Flow**:
```
Redis Queue (ping-jobs)
    ↓
Worker receives: { url, interval, region }
    ↓
HTTP GET request to URL
    ↓
Measure latency
    ↓
Record in MongoDB
    ↓
Check failure counter
    ↓
If 3 consecutive failures → Push alert to Redis queue
```

### 3. Alert Service (alert-service/)
**Purpose**: Consume and process alert events, send notifications

- **Alert Polling**: Continuously polls Redis `alerts` queue
- **Email Notifications**: SMTP integration (Nodemailer) for email alerts
- **Discord Integration**: Webhook-based notifications with rich embeds
- **Slack Integration**: Webhook-based notifications with block messages
- **Stateless Design**: No database, fully driven by Redis

**Tech Stack**:
- Node.js
- Redis for queue consumption
- Nodemailer for email (SMTP)
- Axios for webhook calls (Discord, Slack)

**Alert Flow**:
```
Redis Queue (alerts)
    ↓
Worker polls: { event, url, region, failureCount }
    ↓
Parallel notification sending:
    ├─→ Email (SMTP)
    ├─→ Discord Webhook
    └─→ Slack Webhook
    ↓
Console logging + Success confirmation
```

## Project Structure

```
UpSentinel/
├── api-server/                    # API Server Service
│   ├── config/
│   │   ├── database.js            # MongoDB connection
│   │   └── redis.js               # Redis connection
│   ├── controllers/
│   │   ├── AuthController.js
│   │   └── MonitorController.js
│   ├── middleware/
│   │   └── authenticate.js        # JWT middleware
│   ├── models/
│   │   ├── User.js
│   │   └── Monitor.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── monitors.js
│   ├── services/
│   │   ├── AuthService.js
│   │   ├── MonitorService.js
│   │   └── QueueService.js
│   ├── server.js                  # Main app entry
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── QUICKSTART.md
│
├── ping-worker/                   # Ping Worker Service
│   ├── lib/
│   │   ├── redisClient.js         # Redis connection
│   │   ├── mongoClient.js         # MongoDB connection
│   │   ├── PingResult.js          # Mongoose model
│   │   └── pingService.js         # Ping logic & alerts
│   ├── worker.js                  # Main worker entry
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── QUICKSTART.md
│
├── alert-service/                 # Alert Service
│   ├── lib/
│   │   ├── redisClient.js         # Redis connection
│   │   ├── emailService.js        # Email notifications
│   │   └── webhookService.js      # Discord & Slack
│   ├── alertWorker.js             # Main service entry
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── QUICKSTART.md
│
└── ARCHITECTURE.md                # This file
```

## Data Models

### User (MongoDB)
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Monitor (MongoDB)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  url: String,
  interval: Number (60/300/600),
  antiSleep: Boolean,
  status: String (active/inactive),
  jobId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Ping Result (MongoDB)
```javascript
{
  _id: ObjectId,
  url: String,
  status: String (UP/DOWN),
  statusCode: Number | null,
  latency: Number (ms),
  region: String,
  errorMessage: String | null,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Queue Messages

### Job Queue: `ping-jobs`
Message pushed when monitor is created:
```json
{
  "url": "https://example.com",
  "interval": 60,
  "region": "asia"
}
```

### Alert Queue: `alerts`
Message pushed on critical failure (3 consecutive failures):
```json
{
  "event": "CRITICAL_DOWN",
  "url": "https://example.com",
  "region": "asia",
  "failureCount": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Quick Start

### 1. Start Databases

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

### 2. Start API Server

```bash
cd api-server
npm install
cp .env.example .env
npm run dev
```

Server runs on: `http://localhost:5000`

### 3. Start Ping Worker

```bash
cd ping-worker
npm install
cp .env.example .env
npm run dev
```

Worker listens to `ping-jobs` queue.

### 4. Test the System

**Sign up:**
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

**Create a monitor:**
```bash
curl -X POST http://localhost:5000/monitors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "interval": 60,
    "antiSleep": false
  }'
```

The worker will immediately start pinging the URL and recording results!

## Monitoring & Operations

### Check MongoDB Results

```bash
mongosh
use upsent
db.pingresults.find().pretty()
```

### Check failure counters

```bash
redis-cli
KEYS failure:*
GET failure:https://example.com
```

### Check generated alerts

```bash
redis-cli
LRANGE alerts 0 -1
```

### Check Queue Statistics

```javascript
const { Queue } = require('bullmq');
const queue = new Queue('ping-jobs', {
  connection: { host: 'localhost', port: 6379 }
});
const counts = await queue.getJobCounts();
console.log(counts);
```

## Performance & Scaling

### Horizontal Scaling

Run multiple worker instances for higher throughput:

```bash
# Terminal 1
cd ping-worker && npm run dev

# Terminal 2
cd ping-worker && npm run dev

# Terminal 3
cd ping-worker && npm run dev
```

All workers share the same queue. BullMQ automatically distributes jobs.

### Configuration Tuning

**API Server** (api-server/.env):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/upsent
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

**Ping Worker** (ping-worker/.env):
```env
WORKER_CONCURRENCY=10        # More = faster processing, higher memory
REQUEST_TIMEOUT=10000        # Timeout for HTTP requests
MONGODB_URI=mongodb://localhost:27017/upsent
REDIS_URL=redis://localhost:6379
```

## Failure Detection & Alerts

The system automatically detects service outages:

```
┌─────────────────────────────────┐
│     Monitor: google.com         │
│     Interval: 60 seconds        │
└─────────────────────────────────┘
         │
    Ping #1: FAIL
    Counter: 1/3 ⚠️
         │
    Ping #2: FAIL
    Counter: 2/3 ⚠️
         │
    Ping #3: FAIL
    Counter: 3/3 🚨
         │
    ALERT: CRITICAL_DOWN
    Pushed to: alerts queue
         │
    (Alert service consumes and notifies users)
```

Counters reset on successful ping.

## Development Workflow

### Adding a New Endpoint

1. Create controller method in `api-server/controllers/`
2. Create service method in `api-server/services/`
3. Add route in `api-server/routes/`
4. Test with curl or Postman

### Modifying Worker Behavior

1. Edit logic in `ping-worker/lib/pingService.js`
2. Restart worker: `npm run dev`
3. Changes apply to next job

### Database Schema Changes

1. Update Mongoose model in `models/` or `lib/`
2. MongoDB automatically handles schema-less updates
3. Add indexes for large collections

## Deployment

### Using Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  api-server:
    build: ./api-server
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/upsent
      REDIS_URL: redis://redis:6379

  ping-worker:
    build: ./ping-worker
    depends_on:
      - mongodb
      - redis
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/upsent
      REDIS_URL: redis://redis:6379
      WORKER_CONCURRENCY: 20
```

Run:
```bash
docker-compose up -d
```

### Production Checklist

- [ ] Use strong `JWT_SECRET`
- [ ] Enable MongoDB authentication
- [ ] Use Redis AUTH password
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper MONGODB_URI and REDIS_URL
- [ ] Set up health check endpoints
- [ ] Configure request timeout appropriately
- [ ] Set up monitoring and logging
- [ ] Implement data retention policy
- [ ] Use reverse proxy (nginx)
- [ ] Enable HTTPS/TLS

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot connect to MongoDB" | MongoDB not running | `docker run -d -p 27017:27017 mongo` |
| "Cannot connect to Redis" | Redis not running | `docker run -d -p 6379:6379 redis` |
| "Jobs not processing" | Worker not running | Start worker: `cd ping-worker && npm run dev` |
| "Queue backed up" | Not enough workers | Increase `WORKER_CONCURRENCY` or run more instances |
| "High MongoDB disk usage" | Too many old results | Set up data retention/cleanup script |

## Future Features

- [ ] Email/SMS alert notifications
- [ ] Dashboard with uptime statistics
- [ ] Custom alert rules and policies
- [ ] Team collaboration and role-based access
- [ ] Monitor groups and tagging
- [ ] API rate limiting and usage tracking
- [ ] Webhook integrations
- [ ] Multi-region deployment coordination
- [ ] Real-time WebSocket updates
- [ ] Detailed analytics and reporting

## Documentation

- [API Server README](api-server/README.md)
- [API Server Quick Start](api-server/QUICKSTART.md)
- [Ping Worker README](ping-worker/README.md)
- [Ping Worker Quick Start](ping-worker/QUICKSTART.md)

## Architecture Decisions

1. **Microservices**: Separate API and worker for independent scaling
2. **BullMQ**: Reliable job queuing with Redis backend
3. **MongoDB**: Flexible schema for monitoring data
4. **JWT**: Stateless authentication for horizontal scaling
5. **Redis Counters**: Fast failure tracking without database queries
6. **Concurrent Workers**: Process many URLs in parallel

## License

MIT

## Support

For issues or questions:
1. Check detailed documentation in each service
2. Review error logs
3. Verify database connections
4. Check Redis queue status

---

**Version**: 1.0.0  
**Last Updated**: March 2026
