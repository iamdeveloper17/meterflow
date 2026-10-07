import { z } from 'zod';

export const eventBodySchema = z.object({
  organizationId: z.string().min(1, 'organizationId is required'),
  customerId: z.string().min(1, 'customerId is required'),
  metric: z.string().min(1).max(50),
  value: z.number().positive(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const batchEventBodySchema = z.object({
  events: z.array(eventBodySchema).min(1).max(1000),
});

export type EventBody = z.infer<typeof eventBodySchema>;
export type BatchEventBody = z.infer<typeof batchEventBodySchema>;