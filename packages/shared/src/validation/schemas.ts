import { z } from 'zod';

export const usageEventSchema = z.object({
  customerId: z.string().min(1),
  metric: z.string().min(1).max(50),
  value: z.number().positive(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const batchUsageEventsSchema = z.object({
  events: z.array(usageEventSchema).min(1).max(1000),
});