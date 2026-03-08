const redis = require('redis');

const createRedisClient = async () => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://redis:6379';
    const client = redis.createClient({
      url: redisURL,
    });

    client.on('error', (err) => {
      console.error('✗ Redis connection error:', err);
    });
    
    client.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });

    return client;
  } catch (error) {
    console.error('✗ Redis initialization failed:', error.message);
    process.exit(1);
  }
};

module.exports = createRedisClient;
