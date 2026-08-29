// import { prisma } from "@/lib/prisma";

// export type StandingRow = {
//   position: number;
//   teamId: string;
//   teamName: string;
//   played: number;
//   won: number;
//   drawn: number;
//   lost: number;
//   goalsFor: number;
//   goalsAgainst: number;
//   goalDifference: number;
//   points: number;
// };

// export async function getStandings(tournamentId: string) {
//   const tournament = await prisma.tournament.findUnique({
//     where: {
//       id: tournamentId,
//     },
//     include: {
//       settings: true,
//       teams: {
//         where: {
//           isActive: true,
//         },
//         orderBy: {
//           name: "asc",
//         },
//       },
//       matches: {
//         where: {
//           status: "COMPLETED",
//         },
//         select: {
//           homeTeamId: true,
//           awayTeamId: true,
//           homeScore: true,
//           awayScore: true,
//         },
//       },
//     },
//   });

//   if (!tournament) {
//     throw new Error("Tournament not found.");
//   }

//   if (!tournament.settings) {
//     throw new Error("Tournament settings not found.");
//   }

//   const settings = tournament.settings;

//   const standings = new Map<
//     string,
//     Omit<StandingRow, "position">
//   >();

//   for (const team of tournament.teams) {
//     standings.set(team.id, {
//       teamId: team.id,
//       teamName: team.name,
//       played: 0,
//       won: 0,
//       drawn: 0,
//       lost: 0,
//       goalsFor: 0,
//       goalsAgainst: 0,
//       goalDifference: 0,
//       points: 0,
//     });
//   }

//   for (const match of tournament.matches) {
//     const home = standings.get(match.homeTeamId);
//     const away = standings.get(match.awayTeamId);

//     // Ignore matches involving inactive/deleted teams.
//     if (!home || !away) {
//       continue;
//     }

//     home.played++;
//     away.played++;

//     home.goalsFor += match.homeScore;
//     home.goalsAgainst += match.awayScore;

//     away.goalsFor += match.awayScore;
//     away.goalsAgainst += match.homeScore;

//     if (match.homeScore > match.awayScore) {
//       home.won++;
//       away.lost++;

//       home.points += settings.winPoints;
//       away.points += settings.lossPoints;
//     } else if (match.homeScore < match.awayScore) {
//       away.won++;
//       home.lost++;

//       away.points += settings.winPoints;
//       home.points += settings.lossPoints;
//     } else {
//       home.drawn++;
//       away.drawn++;

//       home.points += settings.drawPoints;
//       away.points += settings.drawPoints;
//     }
//   }

//   for (const team of standings.values()) {
//     team.goalDifference = team.goalsFor - team.goalsAgainst;
//   }

//   const rows = Array.from(standings.values());

//   rows.sort((a, b) => {
//     // 1. Points
//     if (b.points !== a.points) {
//       return b.points - a.points;
//     }

//     // 2. Configured tie-breakers.
//     //
//     // We allow the tournament settings to define the order,
//     // while preventing the same criterion from being applied twice.
//     const tieBreakers = [
//       settings.tieBreaker1,
//       settings.tieBreaker2,
//       settings.tieBreaker3,
//     ];

//     const applied = new Set<string>();

//     for (const tieBreaker of tieBreakers) {
//       if (!tieBreaker || applied.has(tieBreaker)) {
//         continue;
//       }

//       applied.add(tieBreaker);

//       if (tieBreaker === "GOAL_DIFFERENCE") {
//         if (b.goalDifference !== a.goalDifference) {
//           return b.goalDifference - a.goalDifference;
//         }
//       }

//       if (tieBreaker === "GOALS_SCORED") {
//         if (b.goalsFor !== a.goalsFor) {
//           return b.goalsFor - a.goalsFor;
//         }
//       }
//     }

//     // 3. Deterministic fallback.
//     //
//     // This is not a sporting tie-breaker. It simply ensures
//     // the API always returns a stable ordering when every
//     // configured sporting criterion is equal.
//     const nameComparison = a.teamName.localeCompare(b.teamName);

//     if (nameComparison !== 0) {
//       return nameComparison;
//     }

//     return a.teamId.localeCompare(b.teamId);
//   });

//   return rows.map((row, index) => ({
//     position: index + 1,
//     ...row,
//   }));
// }

import { prisma } from "@/lib/prisma";

export type StandingRow = {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export async function getStandings(tournamentId: string) {
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
          name: "asc",
        },
      },
      matches: {
        where: {
          status: "COMPLETED",
        },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.settings) {
    throw new Error("Tournament settings not found.");
  }

  const settings = tournament.settings;

  const standings = new Map<string, Omit<StandingRow, "position">>();

  for (const team of tournament.teams) {
    standings.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of tournament.matches) {
    const home = standings.get(match.homeTeamId);
    const away = standings.get(match.awayTeamId);

    // Ignore matches involving inactive/deleted teams.
    if (!home || !away) {
      continue;
    }

    home.played++;
    away.played++;

    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;

    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;

      home.points += settings.winPoints;
      away.points += settings.lossPoints;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;

      away.points += settings.winPoints;
      home.points += settings.lossPoints;
    } else {
      home.drawn++;
      away.drawn++;

      home.points += settings.drawPoints;
      away.points += settings.drawPoints;
    }
  }

  for (const team of standings.values()) {
    team.goalDifference = team.goalsFor - team.goalsAgainst;
  }

  const rows = Array.from(standings.values());

  rows.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Configured tie-breakers.
    //
    // We allow the tournament settings to define the order,
    // while preventing the same criterion from being applied twice.
    const tieBreakers = [
      settings.tieBreaker1,
      settings.tieBreaker2,
      settings.tieBreaker3,
    ];

    const applied = new Set<string>();

    for (const tieBreaker of tieBreakers) {
      if (!tieBreaker || applied.has(tieBreaker)) {
        continue;
      }

      applied.add(tieBreaker);

      if (tieBreaker === "GOAL_DIFFERENCE") {
        if (b.goalDifference !== a.goalDifference) {
          return b.goalDifference - a.goalDifference;
        }
      }

      if (tieBreaker === "GOALS_SCORED") {
        if (b.goalsFor !== a.goalsFor) {
          return b.goalsFor - a.goalsFor;
        }
      }
    }

    // 3. Deterministic fallback.
    //
    // This is not a sporting tie-breaker. It simply ensures
    // the API always returns a stable ordering when every
    // configured sporting criterion is equal.
    const nameComparison = a.teamName.localeCompare(b.teamName);

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return a.teamId.localeCompare(b.teamId);
  });

  return rows.map((row, index) => ({
    position: index + 1,
    ...row,
  }));
}
