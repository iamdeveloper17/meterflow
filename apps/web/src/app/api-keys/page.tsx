import { Key } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { KeyTable } from '@/components/api-keys/key-table';
import { CreateKeyDialog } from '@/components/api-keys/create-key-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/config';
import { listApiKeys } from '@/lib/api-keys/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getKeys() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const organizationId = 'org_test_001';
    const keys = await listApiKeys(organizationId);

    return keys.map((k: any) => ({
      ...k,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function ApiKeysPage() {
  const keys = await getKeys();
  const activeCount = keys.filter((k: any) => k.isActive).length;

  return (
    <DashboardShell>
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">API Keys</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage API keys for authenticating your requests.
            </p>
          </div>
          <CreateKeyDialog />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Active Keys</p>
                <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
              </div>
              <Key className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Keys</p>
              <p className="mt-1 text-2xl font-semibold">{keys.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="mt-1 text-2xl font-semibold">Production</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyTable keys={keys} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}