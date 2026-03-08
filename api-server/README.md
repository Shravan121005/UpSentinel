# Sentinels API - Backend Server

A robust uptime monitoring SaaS backend API built with Node.js, Express.js, MongoDB, and Redis.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Task Queue**: BullMQ with Redis
- **Authentication**: JWT

## Project Structure

```
api-server/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── redis.js         # Redis connection
├── controllers/         # Request handlers
│   ├── AuthController.js
│   └── MonitorController.js
├── middleware/          # Custom middleware
│   └── authenticate.js  # JWT authentication
├── models/              # Mongoose schemas
│   ├── User.js
│   └── Monitor.js
├── routes/              # API routes
│   ├── auth.js
│   └── monitors.js
├── services/            # Business logic
│   ├── AuthService.js
│   ├── MonitorService.js
│   └── QueueService.js
├── server.js            # Main entry point
├── package.json
└── .env.example
```

## Installation

1. **Clone or navigate to the project**:
   ```bash
   cd api-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/pulseping
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_very_secure_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

## Prerequisites

### MongoDB
Install and run MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally: https://docs.mongodb.com/manual/installation/
```

### Redis
Install and run Redis:
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:latest

# Or install locally: https://redis.io/download
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Health Check

```http
GET /health

Response:
{
  "success": true,
  "message": "PulsePing API is running"
}
```

## Authentication Endpoints

### 1. Sign Up
Create a new user account.

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response (201):
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### 2. Login
Authenticate an existing user.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## Monitor Endpoints

**All monitor endpoints require JWT authentication**

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Create Monitor
Create a new monitoring job.

```http
POST /monitors
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "interval": 60,
  "antiSleep": false
}

Interval values:
- 60 (1 minute)
- 300 (5 minutes)
- 600 (10 minutes)

Response (201):
{
  "success": true,
  "message": "Monitor created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "url": "https://example.com",
    "interval": 60,
    "antiSleep": false,
    "status": "active",
    "jobId": "1",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

Job payload pushed to Redis queue:
```json
{
  "monitorId": "507f1f77bcf86cd799439012",
  "url": "https://example.com",
  "interval": 60,
  "region": "asia"
}
```

### 2. Get All Monitors
Retrieve all monitors for the authenticated user.

```http
GET /monitors
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Monitors retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "url": "https://example.com",
      "interval": 60,
      "antiSleep": false,
      "status": "active",
      "jobId": "1",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Get Single Monitor
Retrieve a specific monitor by ID.

```http
GET /monitors/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Monitor retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "url": "https://example.com",
    "interval": 60,
    "antiSleep": false,
    "status": "active",
    "jobId": "1",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Delete Monitor
Delete a monitor and remove its job from the queue.

```http
DELETE /monitors/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Monitor deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "URL and interval are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Route not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Monitor Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  url: String (required),
  interval: Number (60, 300, or 600),
  antiSleep: Boolean (default: false),
  status: String (active/inactive, default: active),
  jobId: String (BullMQ job ID),
  createdAt: Date,
  updatedAt: Date
}
```

## Queue Integration

When a monitor is created, a job is automatically enqueued in Redis with the following payload:

```javascript
{
  monitorId: string,      // Monitor database ID
  url: string,            // URL to monitor
  interval: number,       // Interval in seconds
  region: string          // Default: "asia"
}
```

The worker service (separate process) will consume these jobs and perform actual health checks.

## JWT Authentication

- **Token Expiry**: 7 days
- **Algorithm**: HS256
- **Payload**: `{ userId }`

### Getting a Token

1. Sign up or login to receive a token
2. Include in all protected requests: `Authorization: Bearer <token>`
3. Token will be verified server-side

## Development Tips

### Using cURL to Test APIs

```bash
# Sign up
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Create Monitor (replace TOKEN with actual JWT)
curl -X POST http://localhost:5000/monitors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "interval": 60,
    "antiSleep": false
  }'

# Get all monitors
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/monitors

# Delete monitor (replace MONITOR_ID with actual ID)
curl -X DELETE http://localhost:5000/monitors/MONITOR_ID \
  -H "Authorization: Bearer TOKEN"
```

## Services Overview

### AuthService
- User registration and login
- Password hashing with bcrypt
- JWT token generation

### MonitorService
- Create, read, delete monitors
- Enqueue monitoring jobs
- Manage queue interactions

### QueueService
- Interface with BullMQ
- Manage job lifecycle
- Queue statistics

## Future Enhancements

- [ ] Email notifications
- [ ] Monitor groups/tags
- [ ] Uptime analytics and reporting
- [ ] Alert policies and conditions
- [ ] Team collaboration features
- [ ] API rate limiting
- [ ] Audit logging

## License

MIT

## Support

For issues or questions, please check the documentation or create an issue in the repository.
