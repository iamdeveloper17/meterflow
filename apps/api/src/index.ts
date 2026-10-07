import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get('/health', async () => ({
  status: 'ok',
  service: 'meterflow-api',
  timestamp: new Date().toISOString(),
}));

const port = Number(process.env.API_PORT) || 3001;

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 API running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}