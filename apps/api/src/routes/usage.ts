import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUsage } from '../services/usage.service';

const usageQuerySchema = z.object({
  organizationId: z.string().min(1),
  metric: z.string().optional(),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM')
    .optional(),
});

export async function usageRoutes(app: FastifyInstance) {
  /**
   * GET /v1/usage/:customerId
   * Query usage for a customer
   */
  app.get('/usage/:customerId', async (request, reply) => {
    const params = request.params as { customerId: string };
    const query = request.query as Record<string, string>;

    const parsed = usageQuerySchema.safeParse({
      organizationId: query.organizationId,
      metric: query.metric,
      billingPeriod: query.billingPeriod,
    });

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    try {
      const usage = await getUsage({
        organizationId: parsed.data.organizationId,
        customerId: params.customerId,
        metric: parsed.data.metric,
        billingPeriod: parsed.data.billingPeriod,
      });

      return reply.send({
        customerId: params.customerId,
        organizationId: parsed.data.organizationId,
        billingPeriod: parsed.data.billingPeriod || getCurrentPeriod(),
        usage,
        count: usage.length,
      });
    } catch (err) {
      request.log.error(err, 'Failed to fetch usage');
      return reply.status(500).send({
        error: 'Failed to fetch usage',
        message: (err as Error).message,
      });
    }
  });
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}