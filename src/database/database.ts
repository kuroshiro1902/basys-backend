import { PrismaClient } from '@/generated/prisma';

export const DB = new PrismaClient({});

// TODO: Delete expired refresh token schedule
