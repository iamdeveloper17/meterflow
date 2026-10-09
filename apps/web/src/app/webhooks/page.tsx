import { Webhook } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { WebhookTable } from '@/components/webhooks/webhook-table';
import { AddWebhookDialog } from '@/components/webhooks/add-webhook-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/config';
import { prisma } from '@meterflow/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getWebhooks() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const organizationId = 'org_test_001';
    const webhooks = await prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((w: any) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      isActive: w.isActive,
      createdAt: w.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function WebhooksPage() {
  const webhooks = await getWebhooks();
  const activeCount = webhooks.filter((w: any) => w.isActive).length;

  return (
    <DashboardShell>
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Receive real-time notifications for events in your account.
            </p>
          </div>
          <AddWebhookDialog />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Active Webhooks</p>
                <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
              </div>
              <Webhook className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Webhooks</p>
              <p className="mt-1 text-2xl font-semibold">{webhooks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-1 text-2xl font-semibold">Healthy</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhookTable webhooks={webhooks} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}