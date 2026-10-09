import { prisma } from '@meterflow/database';
import { generateApiKey, hashApiKey } from './crypto';

interface CreateKeyInput {
  organizationId: string;
  name: string;
  expiresAt?: Date | null;
}

interface CreateKeyResult {
  id: string;
  key: string;      // Full key — show ONCE
  prefix: string;
  name: string;
  createdAt: Date;
}

/**
 * Create a new API key for an organization
 */
export async function createApiKey(
  input: CreateKeyInput
): Promise<CreateKeyResult> {
  const { key, hash, prefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt: input.expiresAt ?? null,
      isActive: true,
    },
  });

  return {
    id: apiKey.id,
    key,
    prefix,
    name: apiKey.name,
    createdAt: apiKey.createdAt,
  };
}

/**
 * List all API keys for an organization (never includes full key)
 */
export async function listApiKeys(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Revoke an API key (soft delete — set isActive false)
 */
export async function revokeApiKey(
  id: string,
  organizationId: string
): Promise<{ success: boolean }> {
  const result = await prisma.apiKey.updateMany({
    where: { id, organizationId },
    data: { isActive: false },
  });

  return { success: result.count > 0 };
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(
  id: string,
  organizationId: string
): Promise<{ success: boolean }> {
  const result = await prisma.apiKey.deleteMany({
    where: { id, organizationId },
  });

  return { success: result.count > 0 };
}

/**
 * Validate an API key (used by Fastify API — will be in Block 3)
 */
export async function validateApiKey(key: string) {
  if (!key.startsWith('mf_live_')) {
    return null;
  }

  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { organization: true },
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
    .catch((err: any) => console.error('Failed to update lastUsedAt:', err));

  return {
    id: apiKey.id,
    organizationId: apiKey.organizationId,
    organization: apiKey.organization,
  };
}