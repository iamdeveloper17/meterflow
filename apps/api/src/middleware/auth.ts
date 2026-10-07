import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: string;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
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

  request.apiKey = apiKey;

  logger.debug({ keyPrefix: apiKey.slice(0, 16) }, 'Auth check passed');

  // TODO Day 4: Validate against database + resolve organizationId
}