import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const teams = await prisma.team.findMany({
      where: {
        tournamentId: id,
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
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch teams." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: tournamentId } = await params;

    const body = await request.json();

    const { name, shortName, logoUrl, captainId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required." },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        settings: true,
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    if (
      tournament.settings?.numberOfTeams &&
      tournament._count.teams >= tournament.settings.numberOfTeams
    ) {
      return NextResponse.json(
        {
          error: `This tournament is configured for ${tournament.settings.numberOfTeams} teams.`,
        },
        { status: 400 },
      );
    }

    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists." },
        { status: 409 },
      );
    }

    const team = await prisma.team.create({
      data: {
        tournamentId,
        name: name.trim(),
        shortName: shortName?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        captainId: captainId || null,
      },
      include: {
        group: true,
        players: {
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create team." },
      { status: 500 },
    );
  }
}
