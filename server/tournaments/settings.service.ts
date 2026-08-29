import { prisma } from "@/lib/prisma";

export type UpdateTournamentSettingsInput = {
  competitionFormat?: "LEAGUE" | "KNOCKOUT" | "GROUP_AND_KNOCKOUT";
  roundRobinType?: "SINGLE" | "DOUBLE";
  numberOfTeams?: number;

  minimumPlayersPerTeam?: number | null;
  maximumPlayersPerTeam?: number | null;

  playersOnPitch?: number;
  outfieldPlayers?: number;

  matchDurationMinutes?: number;
  halfTimeDurationMinutes?: number;

  rollingSubstitutions?: boolean;

  offsideEnabled?: boolean;
  goalkeeperBackPassEnabled?: boolean;
  designatedSubstitutionArea?: boolean;

  refereeHasFinalAuthority?: boolean;
  captainOnlyMayApproachReferee?: boolean;

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

  yellowCardIsWarning?: boolean;
  secondYellowIsRed?: boolean;
  tournamentCommitteeCanSuspend?: boolean;
  seriousMisconductCanDisqualify?: boolean;

  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
};

export async function getTournamentSettings(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      settings: true,
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.settings) {
    throw new Error("Tournament settings not found.");
  }

  return tournament.settings;
}

export async function updateTournamentSettings(
  tournamentId: string,
  input: UpdateTournamentSettingsInput,
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      settings: true,
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.settings) {
    throw new Error("Tournament settings not found.");
  }

  const {
    registrationOpensAt,
    registrationClosesAt,
    ...settings
  } = input;

  if (
    registrationOpensAt &&
    registrationClosesAt &&
    new Date(registrationOpensAt) > new Date(registrationClosesAt)
  ) {
    throw new Error(
      "Registration opening date cannot be after the closing date.",
    );
  }

  return prisma.tournamentSettings.update({
    where: {
      tournamentId,
    },
    data: {
      ...settings,
      ...(registrationOpensAt !== undefined && {
        registrationOpensAt: registrationOpensAt
          ? new Date(registrationOpensAt)
          : null,
      }),
      ...(registrationClosesAt !== undefined && {
        registrationClosesAt: registrationClosesAt
          ? new Date(registrationClosesAt)
          : null,
      }),
    },
  });
}
