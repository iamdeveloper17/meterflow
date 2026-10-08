import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@meterflow/database', '@meterflow/shared'],
  serverExternalPackages: ['@prisma/client', 'prisma', 'ioredis', 'bullmq'],
};

export default nextConfig;