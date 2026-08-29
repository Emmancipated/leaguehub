import { prisma } from "@/lib/prisma";

type GeneratedFixture = {
  homeTeamId: string;
  awayTeamId: string;
  roundNumber: number;
  matchNumber: number;
};

export async function generateFixtures(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      settings: true,
      teams: {
        where: {
          isActive: true,
        },
        orderBy: {
          registeredAt: "asc",
        },
      },
      matches: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.settings) {
    throw new Error("Tournament settings have not been configured.");
  }

  if (tournament.settings.competitionFormat !== "LEAGUE") {
    throw new Error(
      "Fixture generation currently supports league competitions only.",
    );
  }

  if (tournament.teams.length < 2) {
    throw new Error("At least two active teams are required.");
  }

  if (tournament.matches.length > 0) {
    throw new Error("Fixtures already exist for this tournament.");
  }

  const teams = [...tournament.teams];

  const fixtures: GeneratedFixture[] = [];

  /*
   * Circle method requires an even number of teams.
   * For an odd number, add a virtual BYE.
   */
  const BYE_ID = "__BYE__";

  if (teams.length % 2 !== 0) {
    teams.push({
      id: BYE_ID,
    } as (typeof teams)[number]);
  }

  const totalTeams = teams.length;
  const rounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  const rotation = [...teams];

  let matchNumber = 1;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const home = rotation[i];
      const away = rotation[totalTeams - 1 - i];

      /*
       * Skip fixtures involving the virtual BYE.
       */
      if (home.id === BYE_ID || away.id === BYE_ID) {
        continue;
      }

      /*
       * Alternate home/away assignments between rounds.
       */
      const homeTeam = round % 2 === 0 ? home : away;
      const awayTeam = round % 2 === 0 ? away : home;

      fixtures.push({
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        roundNumber: round + 1,
        matchNumber: matchNumber++,
      });
    }

    /*
     * Circle method rotation.
     *
     * Keep the first team fixed and rotate the remaining teams.
     */
    const fixed = rotation[0];
    const rest = rotation.slice(1);

    rest.unshift(rest.pop()!);

    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  /*
   * Double round-robin:
   *
   * First leg:
   *   A vs B
   *
   * Second leg:
   *   B vs A
   */
  if (tournament.settings.roundRobinType === "DOUBLE") {
    const firstLeg = [...fixtures];

    for (const fixture of firstLeg) {
      fixtures.push({
        homeTeamId: fixture.awayTeamId,
        awayTeamId: fixture.homeTeamId,
        roundNumber: fixture.roundNumber + rounds,
        matchNumber: matchNumber++,
      });
    }
  }

  if (fixtures.length === 0) {
    throw new Error("No fixtures could be generated.");
  }

  await prisma.$transaction(
    fixtures.map((fixture) =>
      prisma.match.create({
        data: {
          tournamentId,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          matchNumber: fixture.matchNumber,
          roundNumber: fixture.roundNumber,
          status: "SCHEDULED",
        },
      }),
    ),
  );

  return {
    count: fixtures.length,
    fixtures,
  };
}
