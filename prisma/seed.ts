import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { resolveDatabaseUrl } from "../lib/database-url";

const connectionString = resolveDatabaseUrl();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured. Set DATABASE_URL, or for Vercel Postgres set LEAGUEHUB_DATABASE_URL.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email = "admin@leaguehub.local";
  const password = "Admin123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      name: "LeagueHub Admin",
    },
    create: {
      name: "LeagueHub Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin account ready:");
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
