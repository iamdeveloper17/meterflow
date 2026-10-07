export interface UsageEventJob {
  eventId: string;
  organizationId: string;
  customerId: string;
  metric: string;
  value: number;
  idempotencyKey?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}