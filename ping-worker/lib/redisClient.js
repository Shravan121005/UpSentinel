const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

redisClient.on('error', (err) => {
  console.error('✗ Redis Error:', err);
});

redisClient.on('connect', () => {
  console.log('✓ Redis Client connected');
});

redisClient.on('ready', () => {
  console.log('✓ Redis Client ready');
});

module.exports = redisClient;
