import { FastifyRequest, FastifyReply } from 'fastify';
import { validateApiKey } from '../services/api-key.service';
import { logger } from '../utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    apiKeyId?: string;
    organizationId?: string;
    organizationName?: string;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({
      error: 'Missing Authorization header',
      hint: 'Use: Authorization: Bearer mf_live_xxx',
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Invalid Authorization format',
      hint: 'Use: Authorization: Bearer mf_live_xxx',
    });
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();

  if (!apiKey.startsWith('mf_live_')) {
    return reply.status(401).send({
      error: 'Invalid API key format',
      hint: 'API key must start with mf_live_',
    });
  }

  // Validate against database
  const validated = await validateApiKey(apiKey);

  if (!validated) {
    logger.warn(
      { keyPrefix: apiKey.slice(0, 16) },
      'Invalid API key attempt'
    );
    return reply.status(401).send({
      error: 'Invalid or revoked API key',
    });
  }

  // Attach to request
  request.apiKeyId = validated.id;
  request.organizationId = validated.organizationId;
  request.organizationName = validated.organizationName;

  logger.debug(
    {
      keyPrefix: apiKey.slice(0, 16),
      organizationId: validated.organizationId,
    },
    'Auth check passed'
  );
}