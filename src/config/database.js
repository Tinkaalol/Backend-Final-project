import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  await prisma.$connect();
  console.log(' Database connected');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('Database disconnected');
}
