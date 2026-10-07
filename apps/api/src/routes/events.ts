import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eventBodySchema, batchEventBodySchema } from '../schemas/event.schema';
import { publishUsageEvent, publishBatchUsageEvents } from '../queue/producer';
import type { UsageEventJob } from '@meterflow/shared';

export async function eventsRoutes(app: FastifyInstance) {
  /**
   * POST /v1/events
   * Single event ingestion
   */
  app.post('/events', async (request, reply) => {
    const parsed = eventBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const data = parsed.data;
    const eventId = uuidv4();

    const job: UsageEventJob = {
      eventId,
      organizationId: data.organizationId,
      customerId: data.customerId,
      metric: data.metric,
      value: data.value,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata,
      timestamp: Date.now(),
    };

    try {
      await publishUsageEvent(job);

      return reply.status(202).send({
        status: 'queued',
        eventId,
      });
    } catch (err) {
      request.log.error(err, 'Failed to queue event');
      return reply.status(503).send({
        error: 'Service temporarily unavailable',
        retry: true,
      });
    }
  });

  /**
   * POST /v1/events/batch
   * Batch ingestion (up to 1000 events)
   */
  app.post('/events/batch', async (request, reply) => {
    const parsed = batchEventBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const events = parsed.data.events.map((data) => ({
      eventId: uuidv4(),
      organizationId: data.organizationId,
      customerId: data.customerId,
      metric: data.metric,
      value: data.value,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata,
      timestamp: Date.now(),
    }));

    try {
      await publishBatchUsageEvents(events);

      return reply.status(202).send({
        status: 'queued',
        count: events.length,
        eventIds: events.map((e) => e.eventId),
      });
    } catch (err) {
      request.log.error(err, 'Failed to queue batch');
      return reply.status(503).send({
        error: 'Service temporarily unavailable',
        retry: true,
      });
    }
  });
}