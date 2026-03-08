# UpSentinel - Project Summary

**A complete, production-ready uptime monitoring SaaS platform.**

---

## 📋 Project Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Server** | Node.js + Express | User management, monitor configuration, job scheduling |
| **Ping Worker** | Node.js + BullMQ | Health checks, latency measurement, alert generation |
| **Alert Service** | Node.js + Nodemailer | Handle alerts, send emails, Discord, Slack notifications |
| **Database** | MongoDB | Store users, monitors, ping results |
| **Message Queue** | Redis + BullMQ | Asynchronous job processing |
| **Authentication** | JWT | Secure API access |

---

## 📁 Project Structure

```
UpSentinel/
│
├── api-server/                        # API Server Service
│   ├── config/
│   │   ├── database.js                # MongoDB connection
│   │   └── redis.js                   # Redis connection config
│   ├── controllers/
│   │   ├── AuthController.js          # Auth endpoints
│   │   └── MonitorController.js       # Monitor endpoints
│   ├── middleware/
│   │   └── authenticate.js            # JWT verification
│   ├── models/
│   │   ├── User.js                    # User schema + password hashing
│   │   └── Monitor.js                 # Monitor schema
│   ├── routes/
│   │   ├── auth.js                    # /auth/* routes
│   │   └── monitors.js                # /monitors/* routes
│   ├── services/
│   │   ├── AuthService.js             # Auth logic
│   │   ├── MonitorService.js          # Monitor logic
│   │   └── QueueService.js            # Queue management
│   ├── server.js                      # Main Express app
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md                      # Full API documentation
│   └── QUICKSTART.md                  # Quick start guide
│
├── ping-worker/                       # Ping Worker Service
│   ├── lib/
│   │   ├── redisClient.js             # Redis connection
│   │   ├── mongoClient.js             # MongoDB connection
│   │   ├── PingResult.js              # PingResult schema
│   │   └── pingService.js             # Core ping logic
│   ├── worker.js                      # Main worker process
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md                      # Full worker documentation
│   └── QUICKSTART.md                  # Quick start guide
│
├── alert-service/                     # Alert Service
│   ├── lib/
│   │   ├── redisClient.js             # Redis connection
│   │   ├── emailService.js            # Email notifications
│   │   └── webhookService.js          # Discord & Slack
│   ├── alertWorker.js                 # Main service entry
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md                      # Full service documentation
│   └── QUICKSTART.md                  # Quick start guide
│
├── ARCHITECTURE.md                    # System architecture & design
├── INTEGRATION_GUIDE.md               # End-to-end setup guide
└── README.md                          # This file
```

---

## 🚀 Quick Start (15 minutes)

### 1. Start Databases
```bash
docker run -d -p 27017:27017 mongo           # MongoDB
docker run -d -p 6379:6379 redis:latest      # Redis
```

### 2. Start API Server
```bash
cd api-server
npm install
cp .env.example .env
npm run dev
```

### 3. Start Ping Worker
```bash
cd ping-worker
npm install
cp .env.example .env
npm run dev
```

### 4. Start Alert Service
```bash
cd alert-service
npm install
cp .env.example .env
# Optional: Configure email/Discord/Slack in .env
npm run dev
```

### 5. Test
```bash
# Sign up
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test"
  }'

# Create monitor (use token from signup response)
curl -X POST http://localhost:5000/monitors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "interval": 60
  }'
```

The worker immediately starts monitoring and stores results in MongoDB!

---

## 📊 API Endpoints

### Authentication
```
POST   /auth/signup              Register user
POST   /auth/login               Login user
```

### Monitors (Protected)
```
POST   /monitors                 Create monitor
GET    /monitors                 List user monitors
GET    /monitors/:id             Get monitor details
DELETE /monitors/:id             Delete monitor
```

All endpoints require JWT token: `Authorization: Bearer <token>`

---

### ✅ Core Features

### API Server
- User authentication (signup/login)
- JWT-based authorization (7-day expiry)
- Monitor CRUD operations
- Automatic job enqueuing to Redis
- Mongoose ODM with validation
- CORS enabled
- Graceful error handling

### Ping Worker
- Concurrent health check processing (configurable)
- HTTP GET requests with configurable timeout
- Response latency measurement
- MongoDB result persistence
- Redis failure counter (tracks 3 consecutive failures)
- Alert generation to Redis queue
- Graceful shutdown handling

### Alert Service
- Continuous polling of alerts queue
- Email notifications via SMTP (Nodemailer)
- Discord webhook integration with rich embeds
- Slack webhook integration with block messages
- Configurable notification channels
- Detailed console logging
- Graceful shutdown handling

### Data Management
- **MongoDB**: Users, monitors, ping results
- **Redis**: Job queues, failure counters, alerts
- **Indexes**: Optimized for common queries

---

## 🔄 Data Flow

```
User Creates Monitor
         ↓
API Server:
  - Validates input
  - Stores in MongoDB
  - Pushes job to Redis queue (ping-jobs)
         ↓
Ping Worker:
  - Consumes job from queue
  - Sends HTTP GET request
  - Measures response time
  - Stores result in MongoDB
  - Checks failure counter
         ↓
Failure Tracking:
  - Success → Reset counter
  - Failure → Increment counter
  - 3 Failures → Push alert to Redis (alerts queue)
         ↓
Alert Service:
  - Polls Redis alerts queue
  - Sends email notification (if enabled)
  - Sends Discord message (if enabled)
  - Sends Slack message (if enabled)
  - Logs results to console
         ↓
Team Notified Immediately! ✓
```

---

## 🌐 Using the System

### Create User
```bash
POST /auth/signup
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

### Login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response includes JWT token.

### Create Monitor
```bash
POST /monitors
Authorization: Bearer JWT_TOKEN
{
  "url": "https://example.com",
  "interval": 60,              # 60s (1 min), 300s (5 min), or 600s (10 min)
  "antiSleep": false
}
```

Immediately enqueues monitoring job!

### View Results
```bash
mongosh
use upsent
db.pingresults.find({ url: "https://example.com" }).pretty()
```

---

## 🎯 Key Design Decisions

| Decision | Why |
|----------|-----|
| **Microservices** | Independent scaling, easier maintenance |
| **BullMQ** | Reliable job queue with retries & backoff |
| **MongoDB** | Flexible schema for monitoring data |
| **Redis Counters** | Fast failure tracking without DB queries |
| **JWT Auth** | Stateless, scales horizontally |
| **Concurrent Workers** | High throughput for many monitors |

---

## 📈 Scaling

### Horizontal Scaling
Run multiple worker instances:
```bash
# Terminal 1: API Server
cd api-server && npm run dev

# Terminal 2: Worker 1
cd ping-worker && npm run dev

# Terminal 3: Worker 2  
cd ping-worker && npm run dev

# Terminal 4: Worker 3
cd ping-worker && npm run dev
```

BullMQ automatically distributes jobs across workers.

### Performance Tuning
```env
# In ping-worker/.env
WORKER_CONCURRENCY=20               # Higher = more parallel jobs
REQUEST_TIMEOUT=10000               # HTTP timeout
```

---

## 🔍 Monitoring & Debugging

### Check Queue Status
```bash
redis-cli
LLEN ping-jobs                      # Jobs waiting
LLEN alerts                         # Alerts generated
KEYS failure:*                      # Active failure counters
```

### View Ping Results
```bash
mongosh
use upsent

# All results
db.pingresults.find().pretty()

# Specific URL
db.pingresults.find({ url: "https://example.com" })

# Failed pings
db.pingresults.find({ status: "DOWN" })

# High latency
db.pingresults.find({ latency: { $gt: 1000 } })
```

### Worker Logs
Check terminal where you ran worker:
```
📍 Processing ping for https://google.com in region asia
✓ Job completed: 1 - https://google.com
⚠️  Ping failed for https://example.com (1/3 failures)
⚠️  ALERT: CRITICAL_DOWN for https://example.com
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication with expiry
- ✅ Input validation in all endpoints
- ✅ MongoDB injection prevention (Mongoose)
- ✅ CORS protection
- ✅ Error message sanitization

**Production Recommendations**:
- Use strong `JWT_SECRET` (hint: change from example!)
- Enable MongoDB authentication
- Set Redis password
- Use HTTPS/TLS in load balancer
- Implement rate limiting
- Set up audit logging

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & components |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Complete setup & testing guide |
| [api-server/README.md](api-server/README.md) | API documentation |
| [api-server/QUICKSTART.md](api-server/QUICKSTART.md) | API quick start |
| [ping-worker/README.md](ping-worker/README.md) | Worker documentation |
| [ping-worker/QUICKSTART.md](ping-worker/QUICKSTART.md) | Worker quick start |
| [alert-service/README.md](alert-service/README.md) | Alert Service documentation |
| [alert-service/QUICKSTART.md](alert-service/QUICKSTART.md) | Alert Service quick start |

---

## 🚦 Getting Started

1. **Read** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for step-by-step setup
2. **Start** MongoDB and Redis with Docker
3. **Run** API server: `cd api-server && npm run dev`
4. **Run** Worker: `cd ping-worker && npm run dev`
5. **Test** with curl examples in this guide
6. **Monitor** in MongoDB and Redis

---

## 📋 Deployment Checklist

- [ ] Change JWT_SECRET to secure value
- [ ] Configure MongoDB connection string
- [ ] Configure Redis connection string
- [ ] Set NODE_ENV=production
- [ ] Set WORKER_CONCURRENCY=20+ (adjust per CPU)
- [ ] Enable MongoDB authentication
- [ ] Enable Redis authentication
- [ ] Set up SSL/TLS
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring alerts
- [ ] Configure data retention policy
- [ ] Set up backup strategy

---

## 🔮 Future Enhancements

- [ ] Email/SMS notifications
- [ ] Dashboard with statistics
- [ ] Custom alert rules
- [ ] Team collaboration
- [ ] API rate limiting
- [ ] Webhook integrations
- [ ] Multi-region support
- [ ] Real-time updates (WebSocket)
- [ ] Detailed analytics
- [ ] Mobile app

---

## 💡 Use Cases

✅ Website uptime monitoring
✅ API health checks
✅ Service availability tracking
✅ Performance monitoring (latency)
✅ Multi-region monitoring
✅ Distributed system health checks

---

## 🤝 Support

For issues or questions:

1. **Check Documentation**: Read relevant README files
2. **Check Logs**: 
   - API: Server terminal output
   - Worker: Worker terminal output
   - Database: MongoDB logs
3. **Verify Connections**: Test Redis and MongoDB connectivity
4. **Review Error Messages**: Look for specific error details

---

## 📄 License

MIT

---

## 📦 Tech Stack Summary

```
Frontend Layer:
├─ (Not included - separate project)

Backend Layer:
├─ API Server (Express.js)
├─ Ping Worker (BullMQ)
└─ Alert Service (Nodemailer + Webhooks)

Infrastructure:
├─ MongoDB (Data persistence)
├─ Redis (Queuing & caching)
├─ Docker (Containerization)

Services:
├─ JWT (Authentication)
├─ Axios (HTTP client)
├─ Mongoose (ODM)
├─ bcryptjs (Password hashing)
├─ Nodemailer (Email)
└─ Webhooks (Discord, Slack)
```

---

## 🎉 You're All Set!

The platform is ready to monitor uptime across your services. Start with [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete setup instructions.

**Happy Monitoring! 🚀**

---

**Version**: 1.0.0
**Last Updated**: March 2026
**Status**: Production Ready ✅