import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@meterflow/database';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/webhooks/:id
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

    const result = await prisma.webhook.deleteMany({
      where: { id, organizationId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete webhook error:', err);
    return NextResponse.json(
      { error: 'Failed to delete webhook', message: (err as Error).message },
      { status: 500 }
    );
  }
}