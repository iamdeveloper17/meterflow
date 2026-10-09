import crypto from 'crypto';
import { prisma } from '@meterflow/database';

/**
 * Hash an API key (must match the algorithm used in web app)
 * SHA-256
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key and return associated organization
 */
export async function validateApiKey(key: string): Promise<{
  id: string;
  organizationId: string;
  organizationName: string;
} | null> {
  if (!key.startsWith('mf_live_')) {
    return null;
  }

  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  });

  if (!apiKey || !apiKey.isActive) {
    return null;
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update last used (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error('Failed to update lastUsedAt:', err));

  return {
    id: apiKey.id,
    organizationId: apiKey.organizationId,
    organizationName: apiKey.organization.name,
  };
}