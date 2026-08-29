import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createPrismaAdapter } from "../lib/prisma-adapter";

const adapter = createPrismaAdapter();

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email = "admin@emmanuel.com";
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
