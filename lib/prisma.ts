import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = resolveDatabaseUrl();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Set DATABASE_URL, or for Vercel Postgres set LEAGUEHUB_DATABASE_URL.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
