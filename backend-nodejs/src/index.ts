import app from './app';
import { config } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    // Test Redis connection
    await redis.ping();
    console.log('✓ Redis connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT} in ${config.nodeEnv} mode`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
      console.log(`✓ Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('✗ Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('✗ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

startServer();
