import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createApiKey, listApiKeys } from '@/lib/api-keys/service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/keys
 * List all API keys for the authenticated user's organization
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, use a default organization
    // In production, this would be the user's active organization
    const organizationId = 'org_test_001';

    const keys = await listApiKeys(organizationId);

    return NextResponse.json({ keys });
  } catch (err) {
    console.error('List keys error:', err);
    return NextResponse.json(
      { error: 'Failed to list keys', message: (err as Error).message },
      { status: 500 }
    );
  }
}

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/keys
 * Create a new API key
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const organizationId = 'org_test_001';

    const result = await createApiKey({
      organizationId,
      name: parsed.data.name,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('Create key error:', err);
    return NextResponse.json(
      { error: 'Failed to create key', message: (err as Error).message },
      { status: 500 }
    );
  }
}