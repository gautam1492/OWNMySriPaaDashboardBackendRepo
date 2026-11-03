import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

/**
 * Lightweight connectivity probe used by the boot sequence and the readiness
 * endpoint so a stopped database surfaces as a clear 503 instead of a raw
 * Prisma driver error.
 */
export async function pingDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
}
