export function resolveDatabaseUrl(): string | undefined {
  const env = (name: string): string | undefined => {
    const v = process.env[name];
    return v && v.length > 0 ? v : undefined;
  };

  // 1. Standard / explicit names (local dev via .env, plus Supabase/Neon style).
  for (const name of ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"]) {
    const v = env(name);
    if (v) return v;
  }

  // 2. Vercel Postgres injects connections with the project prefix, e.g.
  //    LEAGUEHUB_DATABASE_URL (direct) and LEAGUEHUB_POOL_DATABASE_URL (pooled).
  //    Prefer the direct connection so Prisma manages its own pooling.
  for (const suffix of ["DATABASE_URL", "POOL_DATABASE_URL"]) {
    const v = env(`LEAGUEHUB_${suffix}`);
    if (v) return v;
  }

  return undefined;
}
