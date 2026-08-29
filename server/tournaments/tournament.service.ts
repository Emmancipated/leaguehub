import { prisma } from "@/lib/prisma";

export interface CreateTournamentInput {
  name: string;
  slug: string;
  description?: string;
  createdById: string;

  startDate?: Date;
  endDate?: Date;

  competitionFormat?:
    | "LEAGUE"
    | "KNOCKOUT"
    | "GROUP_AND_KNOCKOUT";

  roundRobinType?: "SINGLE" | "DOUBLE";

  numberOfTeams: number;

  minimumPlayersPerTeam?: number;
  maximumPlayersPerTeam?: number;

  playersOnPitch?: number;
  outfieldPlayers?: number;

  matchDurationMinutes?: number;
  halfTimeDurationMinutes?: number;

  rollingSubstitutions?: boolean;
  offsideEnabled?: boolean;
  goalkeeperBackPassEnabled?: boolean;
  designatedSubstitutionArea?: boolean;

  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;

  tieBreaker1?:
    | "POINTS"
    | "GOAL_DIFFERENCE"
    | "GOALS_SCORED"
    | "HEAD_TO_HEAD"
    | "FAIR_PLAY"
    | "DRAW";

  tieBreaker2?:
    | "POINTS"
    | "GOAL_DIFFERENCE"
    | "GOALS_SCORED"
    | "HEAD_TO_HEAD"
    | "FAIR_PLAY"
    | "DRAW";

  tieBreaker3?:
    | "POINTS"
    | "GOAL_DIFFERENCE"
    | "GOALS_SCORED"
    | "HEAD_TO_HEAD"
    | "FAIR_PLAY"
    | "DRAW";

  tieBreaker4?:
    | "POINTS"
    | "GOAL_DIFFERENCE"
    | "GOALS_SCORED"
    | "HEAD_TO_HEAD"
    | "FAIR_PLAY"
    | "DRAW";

  tieBreaker5?:
    | "POINTS"
    | "GOAL_DIFFERENCE"
    | "GOALS_SCORED"
    | "HEAD_TO_HEAD"
    | "FAIR_PLAY"
    | "DRAW";

  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
}

export async function createTournament(
  input: CreateTournamentInput,
) {
  const existingTournament =
    await prisma.tournament.findUnique({
      where: {
        slug: input.slug,
      },
      select: {
        id: true,
      },
    });

  if (existingTournament) {
    throw new Error(
      "A tournament with this slug already exists.",
    );
  }

  return prisma.tournament.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      createdById: input.createdById,

      startDate: input.startDate,
      endDate: input.endDate,

      settings: {
        create: {
          competitionFormat:
            input.competitionFormat ?? "LEAGUE",

          roundRobinType:
            input.roundRobinType ?? "SINGLE",

          numberOfTeams: input.numberOfTeams,

          minimumPlayersPerTeam:
            input.minimumPlayersPerTeam,

          maximumPlayersPerTeam:
            input.maximumPlayersPerTeam,

          playersOnPitch:
            input.playersOnPitch ?? 6,

          outfieldPlayers:
            input.outfieldPlayers ?? 5,

          matchDurationMinutes:
            input.matchDurationMinutes ?? 15,

          halfTimeDurationMinutes:
            input.halfTimeDurationMinutes ?? 5,

          rollingSubstitutions:
            input.rollingSubstitutions ?? true,

          offsideEnabled:
            input.offsideEnabled ?? false,

          goalkeeperBackPassEnabled:
            input.goalkeeperBackPassEnabled ?? false,

          designatedSubstitutionArea:
            input.designatedSubstitutionArea ?? true,

          winPoints:
            input.winPoints ?? 3,

          drawPoints:
            input.drawPoints ?? 1,

          lossPoints:
            input.lossPoints ?? 0,

          tieBreaker1:
            input.tieBreaker1 ??
            "GOAL_DIFFERENCE",

          tieBreaker2:
            input.tieBreaker2 ??
            "GOALS_SCORED",

          tieBreaker3:
            input.tieBreaker3 ??
            "HEAD_TO_HEAD",

          tieBreaker4:
            input.tieBreaker4 ??
            "FAIR_PLAY",

          tieBreaker5:
            input.tieBreaker5 ?? "DRAW",

          registrationOpensAt:
            input.registrationOpensAt,

          registrationClosesAt:
            input.registrationClosesAt,
        },
      },
    },

    include: {
      settings: true,
    },
  });
}
