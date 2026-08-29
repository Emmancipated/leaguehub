import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  description: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  competitionFormat: z.enum(["LEAGUE", "KNOCKOUT", "GROUP_AND_KNOCKOUT"]),

  roundRobinType: z.enum(["SINGLE", "DOUBLE"]),

  numberOfTeams: z.number().int().min(2).max(128),

  minimumPlayersPerTeam: z.number().int().min(1).optional(),
  maximumPlayersPerTeam: z.number().int().min(1).optional(),

  playersOnPitch: z.number().int().min(1).max(11),
  outfieldPlayers: z.number().int().min(0).max(10),

  matchDurationMinutes: z.number().int().min(1).max(120),
  halfTimeDurationMinutes: z.number().int().min(0).max(60),

  rollingSubstitutions: z.boolean(),

  offsideEnabled: z.boolean(),
  goalkeeperBackPassEnabled: z.boolean(),
  designatedSubstitutionArea: z.boolean(),

  refereeHasFinalAuthority: z.boolean(),
  captainOnlyMayApproachReferee: z.boolean(),

  winPoints: z.number().int().min(0).max(10),
  drawPoints: z.number().int().min(0).max(10),
  lossPoints: z.number().int().min(0).max(10),

  tieBreaker1: z.enum([
    "POINTS",
    "GOAL_DIFFERENCE",
    "GOALS_SCORED",
    "HEAD_TO_HEAD",
    "FAIR_PLAY",
    "DRAW",
  ]),
  tieBreaker2: z.enum([
    "POINTS",
    "GOAL_DIFFERENCE",
    "GOALS_SCORED",
    "HEAD_TO_HEAD",
    "FAIR_PLAY",
    "DRAW",
  ]),
  tieBreaker3: z.enum([
    "POINTS",
    "GOAL_DIFFERENCE",
    "GOALS_SCORED",
    "HEAD_TO_HEAD",
    "FAIR_PLAY",
    "DRAW",
  ]),
  tieBreaker4: z.enum([
    "POINTS",
    "GOAL_DIFFERENCE",
    "GOALS_SCORED",
    "HEAD_TO_HEAD",
    "FAIR_PLAY",
    "DRAW",
  ]),
  tieBreaker5: z.enum([
    "POINTS",
    "GOAL_DIFFERENCE",
    "GOALS_SCORED",
    "HEAD_TO_HEAD",
    "FAIR_PLAY",
    "DRAW",
  ]),

  yellowCardIsWarning: z.boolean(),
  secondYellowIsRed: z.boolean(),
  tournamentCommitteeCanSuspend: z.boolean(),
  seriousMisconductCanDisqualify: z.boolean(),

  registrationOpensAt: z.string().optional(),
  registrationClosesAt: z.string().optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
