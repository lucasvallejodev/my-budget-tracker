import { PrismaClient } from '@/generated/prisma/client';

const createPrismaClient = () => {
  const accelerateUrl = process.env.DATABASE_URL;

  if (!accelerateUrl) {
    throw new Error('DATABASE_URL is required to initialize Prisma Client.');
  }

  return new PrismaClient({ accelerateUrl });
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
