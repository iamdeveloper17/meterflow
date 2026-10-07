import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { eventsRoutes } from './routes/events';
import { usageRoutes } from './routes/usage';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

const app = Fastify({
  loggerInstance: logger,
});

await app.register(cors, { origin: true });

// Health check (no auth)
app.get('/health', async () => ({
  status: 'ok',
  service: 'meterflow-api',
  timestamp: new Date().toISOString(),
}));

// Protected routes
await app.register(
  async (instance) => {
    instance.addHook('preHandler', authMiddleware);
    await instance.register(eventsRoutes);
    await instance.register(usageRoutes);
  },
  { prefix: '/v1' }
);

const port = Number(process.env.API_PORT) || 3001;

try {
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`🚀 API running on http://localhost:${port}`);
} catch (err) {
  logger.error(err);
  process.exit(1);
}