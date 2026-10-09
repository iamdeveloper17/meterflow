import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { revokeApiKey } from '@/lib/api-keys/service';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/keys/:id
 * Revoke (soft delete) an API key
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = 'org_test_001';

    const result = await revokeApiKey(id, organizationId);

    if (!result.success) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Revoke key error:', err);
    return NextResponse.json(
      { error: 'Failed to revoke key', message: (err as Error).message },
      { status: 500 }
    );
  }
}