import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type Params = {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
};

const ALLOWED_STATUSES = [
  "SCHEDULED",
  "LIVE",
  "HALF_TIME",
  "COMPLETED",
  "POSTPONED",
  "CANCELLED",
] as const;

type MatchStatus = (typeof ALLOWED_STATUSES)[number];

function isValidStatus(value: unknown): value is MatchStatus {
  return (
    typeof value === "string" && ALLOWED_STATUSES.includes(value as MatchStatus)
  );
}

function parseScore(value: unknown) {
  const score = Number(value);

  if (!Number.isInteger(score) || score < 0) {
    return null;
  }

  return score;
}

function parsePositiveInteger(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { tournamentId, matchId } = await params;

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        group: true,
        events: {
          include: {
            player: true,
            assistedByPlayer: true,
            assistedByMatchPlayer: true,
          },
          orderBy: [
            {
              minute: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Failed to fetch match:", error);

    return NextResponse.json(
      { error: "Failed to fetch match." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdmin();

    const { tournamentId, matchId } = await params;
    const body = await request.json();

    const existingMatch = await prisma.match.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const data: {
      status?: MatchStatus;
      homeScore?: number;
      awayScore?: number;
      homeTeamId?: string;
      awayTeamId?: string;
      groupId?: string | null;
      matchNumber?: number | null;
      roundNumber?: number | null;
      scheduledAt?: Date | null;
      venue?: string | null;
      refereeName?: string | null;
    } = {};

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid match status." },
          { status: 400 },
        );
      }

      data.status = body.status;
    }

    if (body.homeScore !== undefined) {
      const score = parseScore(body.homeScore);

      if (score === null) {
        return NextResponse.json(
          { error: "Home score must be a non-negative integer." },
          { status: 400 },
        );
      }

      data.homeScore = score;
    }

    if (body.awayScore !== undefined) {
      const score = parseScore(body.awayScore);

      if (score === null) {
        return NextResponse.json(
          { error: "Away score must be a non-negative integer." },
          { status: 400 },
        );
      }

      data.awayScore = score;
    }

    const homeTeamId = body.homeTeamId ?? existingMatch.homeTeamId;
    const awayTeamId = body.awayTeamId ?? existingMatch.awayTeamId;

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: "Home and away teams must be different." },
        { status: 400 },
      );
    }

    if (body.homeTeamId !== undefined || body.awayTeamId !== undefined) {
      const teams = await prisma.team.findMany({
        where: {
          id: { in: [homeTeamId, awayTeamId] },
          tournamentId,
          isActive: true,
        },
        select: { id: true },
      });

      if (teams.length !== 2) {
        return NextResponse.json(
          { error: "Both teams must belong to this tournament and be active." },
          { status: 400 },
        );
      }

      data.homeTeamId = homeTeamId;
      data.awayTeamId = awayTeamId;
    }

    if (body.groupId !== undefined) {
      if (body.groupId === null || body.groupId === "") {
        data.groupId = null;
      } else {
        const group = await prisma.tournamentGroup.findFirst({
          where: { id: body.groupId, tournamentId },
          select: { id: true },
        });

        if (!group) {
          return NextResponse.json(
            { error: "Invalid tournament group." },
            { status: 400 },
          );
        }

        data.groupId = body.groupId;
      }
    }

    try {
      if (body.matchNumber !== undefined) {
        data.matchNumber = parsePositiveInteger(
          body.matchNumber,
          "Match number",
        );
      }

      if (body.roundNumber !== undefined) {
        data.roundNumber = parsePositiveInteger(
          body.roundNumber,
          "Round number",
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid match number.",
        },
        { status: 400 },
      );
    }

    if (data.matchNumber !== undefined && data.matchNumber !== null) {
      const duplicate = await prisma.match.findFirst({
        where: {
          tournamentId,
          matchNumber: data.matchNumber,
          id: { not: matchId },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Match number ${data.matchNumber} is already in use in this tournament.`,
          },
          { status: 409 },
        );
      }
    }

    if (body.scheduledAt !== undefined) {
      if (!body.scheduledAt) {
        data.scheduledAt = null;
      } else {
        const date = new Date(body.scheduledAt);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Invalid scheduled date." },
            { status: 400 },
          );
        }

        data.scheduledAt = date;
      }
    }

    if (body.venue !== undefined) {
      data.venue =
        typeof body.venue === "string" && body.venue.trim()
          ? body.venue.trim()
          : null;
    }

    if (body.refereeName !== undefined) {
      data.refereeName =
        typeof body.refereeName === "string" && body.refereeName.trim()
          ? body.refereeName.trim()
          : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields were provided for update." },
        { status: 400 },
      );
    }

    const match = await prisma.match.update({
      where: {
        id: matchId,
      },
      data,
      include: {
        homeTeam: true,
        awayTeam: true,
        group: true,
        events: {
          include: {
            player: true,
          },
          orderBy: [
            {
              minute: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Failed to update match:", error);

    return NextResponse.json(
      { error: "Failed to update match." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdmin();

    const { tournamentId, matchId } = await params;

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    await prisma.match.delete({
      where: {
        id: matchId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Failed to delete match:", error);

    return NextResponse.json(
      { error: "Failed to delete match." },
      { status: 500 },
    );
  }
}
