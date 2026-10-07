export interface UsageEvent {
  id: string;
  customerId: string;
  metric: string;
  value: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}