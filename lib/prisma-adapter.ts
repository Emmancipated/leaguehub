import type { PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { resolveDatabaseUrl } from "./database-url";

export function resolveConnectionString(): string {
  const url = resolveDatabaseUrl();

  if (!url) {
    throw new Error(
      "DATABASE_URL is not defined. Set DATABASE_URL, or for Vercel Postgres set LEAGUEHUB_DATABASE_URL.",
    );
  }

  return url;
}

// Managed Postgres providers (Vercel/Neon/Render/Supabase) require TLS, but
// `pg` only enables SSL when the connection string carries `?sslmode=require`.
// Enable it for any non-local host; local docker (127.0.0.1) has no SSL.
export function createPrismaAdapter(): PrismaPg {
  const connectionString = resolveConnectionString();
  const poolConfig: PoolConfig = { connectionString };

  try {
    const hostname = new URL(connectionString).hostname;
    if (
      hostname !== "127.0.0.1" &&
      hostname !== "localhost" &&
      hostname !== "::1"
    ) {
      poolConfig.ssl = { rejectUnauthorized: true };
    }
  } catch {}

  return new PrismaPg(poolConfig);
}
