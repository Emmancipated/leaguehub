import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function requireAdmin() {
  return requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.TOURNAMENT_ADMIN,
  ]);
}

export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN]);
}

export async function requireReferee() {
  return requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.TOURNAMENT_ADMIN,
    UserRole.REFEREE,
  ]);
}
