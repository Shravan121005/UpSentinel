# Quick Start Guide for PulsePing API

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/pulseping
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
NODE_ENV=development
```

## 3. Start Services (if not running)

### MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Redis
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

## 4. Start the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Server runs at: **http://localhost:5000**

## 5. Test the API

### Sign Up
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

Response includes JWT token.

### Create Monitor
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

### Get Monitors
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/monitors
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | ❌ | Register user |
| POST | `/auth/login` | ❌ | Login user |
| POST | `/monitors` | ✅ | Create monitor |
| GET | `/monitors` | ✅ | List monitors |
| GET | `/monitors/:id` | ✅ | Get monitor |
| DELETE | `/monitors/:id` | ✅ | Delete monitor |

## Key Features

✅ JWT Authentication (7-day expiry)
✅ MongoDB database with Mongoose ODM
✅ BullMQ job queue integration
✅ Password hashing with bcrypt
✅ Error handling and validation
✅ RESTful API design

## File Structure

```
api-server/
├── config/              # DB & Redis config
├── controllers/         # Route handlers
├── middleware/          # JWT auth middleware
├── models/              # Mongoose schemas
├── routes/              # API routes
├── services/            # Business logic
├── server.js            # Main app
└── package.json
```

## Troubleshooting

**MongoDB connection error**: Ensure MongoDB is running on localhost:27017
**Redis connection error**: Ensure Redis is running on localhost:6379
**Port already in use**: Change PORT in .env file

## Next Steps

1. Set up the worker service to process monitoring jobs from the queue
2. Implement the actual health check logic
3. Add response logging and analytics
4. Deploy to production
