import { PrismaClient } from '@/generated/prisma';

export const postgres = new PrismaClient({});

// TODO: Delete expired refresh token schedule
