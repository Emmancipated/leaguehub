import { prisma } from "@/lib/prisma";

export async function getTournamentTeams(tournamentId: string) {
  return prisma.team.findMany({
    where: {
      tournamentId,
    },
    include: {
      group: true,
      players: {
        where: {
          isActive: true,
        },
        include: {
          player: true,
        },
      },
      managers: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getTeam(
  tournamentId: string,
  teamId: string,
) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
    },
    include: {
      group: true,
      players: {
        where: {
          isActive: true,
        },
        include: {
          player: true,
        },
      },
      managers: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function createTeam(
  tournamentId: string,
  input: {
    name: string;
    shortName?: string;
    logoUrl?: string;
    groupId?: string;
  },
) {
  const name = input.name?.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      settings: true,
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (tournament.settings) {
    const teamCount = await prisma.team.count({
      where: {
        tournamentId,
        isActive: true,
      },
    });

    if (teamCount >= tournament.settings.numberOfTeams) {
      throw new Error("The tournament has reached its team limit.");
    }
  }

  if (input.groupId) {
    const group = await prisma.tournamentGroup.findFirst({
      where: {
        id: input.groupId,
        tournamentId,
      },
    });

    if (!group) {
      throw new Error("Group not found.");
    }
  }

  try {
    return await prisma.team.create({
      data: {
        tournamentId,
        name,
        shortName: input.shortName?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        groupId: input.groupId || null,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Team_tournamentId_name")
    ) {
      throw new Error("A team with this name already exists.");
    }

    throw error;
  }
}

export async function updateTeam(
  tournamentId: string,
  teamId: string,
  input: {
    name: string;
  },
) {
  const name = input.name?.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
    },
  });

  if (!team) {
    throw new Error("Team not found.");
  }

  try {
    return await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Team_tournamentId_name")
    ) {
      throw new Error("A team with this name already exists.");
    }

    throw error;
  }
}
