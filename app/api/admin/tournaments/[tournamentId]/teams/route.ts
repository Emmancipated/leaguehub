// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// type Params = {
//   params: Promise<{
//     tournamentId: string;
//   }>;
// };

// // GET /api/admin/tournaments/:tournamentId/teams
// export async function GET(_request: NextRequest, { params }: Params) {
//   try {
//     const { tournamentId } = await params;

//     const teams = await prisma.team.findMany({
//       where: {
//         tournamentId,
//       },
//       include: {
//         players: {
//           where: {
//             isActive: true,
//           },
//           include: {
//             player: true,
//           },
//         },
//         managers: {
//           include: {
//             user: true,
//           },
//         },
//         group: true,
//       },
//       orderBy: {
//         name: "asc",
//       },
//     });

//     return NextResponse.json(teams);
//   } catch (error) {
//     console.error("GET teams error:", error);

//     return NextResponse.json(
//       { error: "Failed to fetch teams" },
//       { status: 500 },
//     );
//   }
// }

// // POST /api/admin/tournaments/:tournamentId/teams
// export async function POST(request: NextRequest, { params }: Params) {
//   try {
//     const { tournamentId } = await params;

//     const body = await request.json();

//     const name = body.name?.trim();
//     const shortName = body.shortName?.trim() || null;
//     const logoUrl = body.logoUrl?.trim() || null;

//     if (!name) {
//       return NextResponse.json(
//         { error: "Team name is required" },
//         { status: 400 },
//       );
//     }

//     const tournament = await prisma.tournament.findUnique({
//       where: {
//         id: tournamentId,
//       },
//       include: {
//         settings: true,
//       },
//     });

//     if (!tournament) {
//       return NextResponse.json(
//         { error: "Tournament not found" },
//         { status: 404 },
//       );
//     }

//     if (tournament.status !== "DRAFT") {
//       return NextResponse.json(
//         {
//           error:
//             "Teams can only be added while the tournament is in draft status",
//         },
//         { status: 400 },
//       );
//     }

//     const existingTeam = await prisma.team.findUnique({
//       where: {
//         tournamentId_name: {
//           tournamentId,
//           name,
//         },
//       },
//     });

//     if (existingTeam) {
//       return NextResponse.json(
//         { error: "A team with this name already exists" },
//         { status: 409 },
//       );
//     }

//     const team = await prisma.team.create({
//       data: {
//         tournamentId,
//         name,
//         shortName,
//         logoUrl,
//       },
//     });

//     return NextResponse.json(team, { status: 201 });
//   } catch (error) {
//     console.error("POST team error:", error);

//     return NextResponse.json(
//       { error: "Failed to create team" },
//       { status: 500 },
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ tournamentId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { tournamentId } = await params;

    const teams = await prisma.team.findMany({
      where: {
        tournamentId,
      },
      include: {
        group: true,
        _count: {
          select: {
            players: true,
            managers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Failed to fetch teams:", error);

    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { tournamentId } = await params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const shortName = body.shortName ? String(body.shortName).trim() : null;
    const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId,
        name,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 },
      );
    }

    if (tournament.settings) {
      const teamCount = await prisma.team.count({
        where: {
          tournamentId,
        },
      });

      if (
        tournament.settings.numberOfTeams > 0 &&
        teamCount >= tournament.settings.numberOfTeams
      ) {
        return NextResponse.json(
          {
            error: `This tournament allows a maximum of ${tournament.settings.numberOfTeams} teams`,
          },
          { status: 400 },
        );
      }
    }

    const team = await prisma.team.create({
      data: {
        tournamentId,
        name,
        shortName,
        logoUrl,
      },
      include: {
        group: true,
        _count: {
          select: {
            players: true,
            managers: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Failed to create team:", error);

    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}
