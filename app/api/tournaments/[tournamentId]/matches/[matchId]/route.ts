import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type Params = {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
};

// const ALLOWED_STATUSES = [
//   "SCHEDULED",
//   "LIVE",
//   "HALF_TIME",
//   "COMPLETED",
//   "POSTPONED",
//   "CANCELLED",
// ] as const;
const ALLOWED_STATUSES = ["SCHEDULED", "LIVE", "COMPLETED"] as const;

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
    await requireAdmin();

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
      scheduledAt?: Date | null;
      venue?: string | null;
      refereeName?: string | null;
    } = {};

    // if (body.status !== undefined) {
    //   if (!isValidStatus(body.status)) {
    //     return NextResponse.json(
    //       { error: "Invalid match status." },
    //       { status: 400 },
    //     );
    //   }

    //   data.status = body.status;
    // }
    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid match status." },
          { status: 400 },
        );
      }

      const currentStatus = existingMatch.status;

      const validTransition =
        (currentStatus === "SCHEDULED" && body.status === "LIVE") ||
        (currentStatus === "LIVE" && body.status === "COMPLETED") ||
        currentStatus === body.status;

      if (!validTransition) {
        return NextResponse.json(
          {
            error: `Invalid match status transition from ${currentStatus} to ${body.status}.`,
          },
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
    await requireAdmin();

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
