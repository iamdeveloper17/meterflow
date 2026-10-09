import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@meterflow/database';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
});

/**
 * GET /api/webhooks
 * List webhooks for the org
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = 'org_test_001';

    const webhooks = await prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.isActive,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('List webhooks error:', err);
    return NextResponse.json(
      { error: 'Failed to list webhooks', message: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a webhook
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const organizationId = 'org_test_001';

    // Generate a secret for webhook signing
    const crypto = require('crypto');
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        organizationId,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret, // shown once
        isActive: webhook.isActive,
        createdAt: webhook.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Create webhook error:', err);
    return NextResponse.json(
      { error: 'Failed to create webhook', message: (err as Error).message },
      { status: 500 }
    );
  }
}