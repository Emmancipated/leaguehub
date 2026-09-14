import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createPrismaAdapter } from "../lib/prisma-adapter";

const adapter = createPrismaAdapter();

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminEmail = "admin@emmanuel.com";
  const adminPassword = "Admin123!";
  const superAdminEmail = "superadmin@emmanuel.com";
  const superAdminPassword = "SuperAdmin123!";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: "TOURNAMENT_ADMIN",
      name: "LeagueHub Admin",
    },
    create: {
      name: "LeagueHub Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "TOURNAMENT_ADMIN",
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      name: "LeagueHub Super Admin",
    },
    create: {
      name: "LeagueHub Super Admin",
      email: superAdminEmail,
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin accounts ready:");
  console.log(`Admin: ${admin.email} / ${adminPassword}`);
  console.log(`Super admin: ${superAdmin.email} / ${superAdminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
