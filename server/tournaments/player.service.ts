import { prisma } from "@/lib/prisma";

export type BulkPlayerRow = {
  firstName: string;
  lastName: string;
  displayName?: string | null;
  jerseyNumber?: number | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  teamName?: string | null;
};

export type BulkResult = {
  created: number;
  skipped: number;
  errors: { row: number; error: string }[];
};

export async function bulkRegisterPlayers(
  tournamentId: string,
  rows: BulkPlayerRow[],
): Promise<BulkResult> {
  const [tournament, teams] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { settings: true },
    }),
    prisma.team.findMany({
      where: { tournamentId, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  const teamByName = new Map(
    teams.map((team) => [team.name.toLowerCase(), team.id]),
  );
  const counts = new Map(teams.map((team) => [team.id, 0]));

  const result: BulkResult = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    try {
      if (!row.firstName) {
        throw new Error("First name is required.");
      }

      let teamId: string | null = null;

      if (row.teamName) {
        const teamIdCandidate = teamByName.get(
          row.teamName.toLowerCase(),
        );

        if (!teamIdCandidate) {
          throw new Error(`Team "${row.teamName}" not found.`);
        }

        if (tournament.settings?.maximumPlayersPerTeam) {
          const current = counts.get(teamIdCandidate) ?? 0;

          if (current >= tournament.settings.maximumPlayersPerTeam) {
            throw new Error(
              `Team "${row.teamName}" has reached its player limit.`,
            );
          }

          counts.set(teamIdCandidate, current + 1);
        }

        teamId = teamIdCandidate;
      }

      await prisma.$transaction(async (tx) => {
        const player = await tx.player.create({
          data: {
            tournamentId,
            firstName: row.firstName,
            lastName: row.lastName,
            displayName: row.displayName || null,
            jerseyNumber: row.jerseyNumber ?? null,
            dateOfBirth: row.dateOfBirth
              ? new Date(row.dateOfBirth)
              : null,
            phoneNumber: row.phoneNumber || null,
            registrationStatus: "ACTIVE",
          },
        });

        if (teamId) {
          await tx.teamPlayer.create({
            data: {
              teamId,
              playerId: player.id,
            },
          });
        }
      });

      result.created++;
    } catch (error) {
      result.skipped++;
      result.errors.push({
        row: rowNumber,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create player.",
      });
    }
  }

  return result;
}
