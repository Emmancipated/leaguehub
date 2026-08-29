import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    tournamentId: string;
  }>;
};

function parsePositiveInteger(
  value: unknown,
  fieldName: string,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

function parseScheduledAt(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Scheduled date and time must be valid.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Scheduled date and time must be valid.");
  }

  return date;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        group: true,
      },
      orderBy: [
        {
          roundNumber: "asc",
        },
        {
          scheduledAt: "asc",
        },
        {
          matchNumber: "asc",
        },
      ],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch matches.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tournamentId } = await params;

    const body = await request.json();

    const {
      homeTeamId,
      awayTeamId,
      groupId,
      matchNumber,
      roundNumber,
      scheduledAt,
      venue,
    } = body;

    /*
     * Basic required fields.
     */
    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        {
          error: "Home team and away team are required.",
        },
        { status: 400 },
      );
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        {
          error: "A team cannot play against itself.",
        },
        { status: 400 },
      );
    }

    /*
     * Make sure the tournament exists.
     */
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Validate numeric fields.
     */
    let parsedMatchNumber: number | null;
    let parsedRoundNumber: number | null;

    try {
      parsedMatchNumber = parsePositiveInteger(matchNumber, "Match number");

      parsedRoundNumber = parsePositiveInteger(roundNumber, "Round number");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid match or round number.",
        },
        { status: 400 },
      );
    }

    /*
     * Validate scheduled date.
     */
    let parsedScheduledAt: Date | null;

    try {
      parsedScheduledAt = parseScheduledAt(scheduledAt);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid scheduled date and time.",
        },
        { status: 400 },
      );
    }

    /*
     * Make sure both teams belong to this tournament
     * and are active.
     */
    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: [homeTeamId, awayTeamId],
        },
        tournamentId,
        isActive: true,
      },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (teams.length !== 2) {
      return NextResponse.json(
        {
          error: "Both teams must belong to this tournament and be active.",
        },
        { status: 400 },
      );
    }

    /*
     * Validate the optional group.
     */
    if (groupId) {
      const group = await prisma.tournamentGroup.findFirst({
        where: {
          id: groupId,
          tournamentId,
        },
        select: {
          id: true,
        },
      });

      if (!group) {
        return NextResponse.json(
          {
            error: "Invalid tournament group.",
          },
          { status: 400 },
        );
      }
    }

    /*
     * Give a useful error before Prisma's unique constraint
     * is reached.
     */
    if (parsedMatchNumber !== null) {
      const existingMatch = await prisma.match.findFirst({
        where: {
          tournamentId,
          matchNumber: parsedMatchNumber,
        },
        select: {
          id: true,
        },
      });

      if (existingMatch) {
        return NextResponse.json(
          {
            error: `Match number ${parsedMatchNumber} is already in use in this tournament.`,
          },
          { status: 409 },
        );
      }
    }

    /*
     * Create the match.
     *
     * Manual matches use the exact same Match model as
     * automatically generated fixtures.
     */
    const match = await prisma.match.create({
      data: {
        tournamentId,
        homeTeamId,
        awayTeamId,
        groupId: groupId || null,
        matchNumber: parsedMatchNumber,
        roundNumber: parsedRoundNumber,
        scheduledAt: parsedScheduledAt,
        venue: typeof venue === "string" && venue.trim() ? venue.trim() : null,
        status: "SCHEDULED",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        group: true,
      },
    });

    return NextResponse.json(match, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create match:", error);

    /*
     * Handle Prisma unique constraint errors as a fallback.
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A match with this match number already exists in this tournament.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create match.",
      },
      { status: 500 },
    );
  }
}
