'use client';

import { Activity, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Metric {
  id: string;
  name: string;
  displayName: string;
  unit: string;
  aggregation: string;
  organizationId: string;
  createdAt: string;
  liveUsage: number;
  customerCount: number;
  recordCount: number;
}

interface MetricTableProps {
  metrics: Metric[];
}

export function MetricTable({ metrics }: MetricTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">No metrics yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Metrics will appear here when you send events.
        </p>
        <code className="mt-3 inline-block rounded bg-muted px-2 py-1 text-xs">
          POST /v1/events
        </code>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Aggregation</TableHead>
            <TableHead className="text-right">Customers</TableHead>
            <TableHead className="text-right">Live Usage</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-primary/10 p-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{metric.displayName}</span>
                </div>
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {metric.name}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {metric.unit}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {metric.aggregation}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {metric.customerCount}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">
                  {metric.liveUsage.toLocaleString()}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(metric.createdAt).toISOString().split('T')[0]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}