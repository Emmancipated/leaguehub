import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { matchId } = await params;
    const body = await request.json();

    const allowedStatuses = [
      "SCHEDULED",
      "LIVE",
      "HALF_TIME",
      "COMPLETED",
      "POSTPONED",
      "CANCELLED",
    ];

    if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid match status." },
        { status: 400 },
      );
    }

    const existingMatch = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const data: {
      status?:
        | "SCHEDULED"
        | "LIVE"
        | "HALF_TIME"
        | "COMPLETED"
        | "POSTPONED"
        | "CANCELLED";
      homeScore?: number;
      awayScore?: number;
      refereeName?: string | null;
    } = {};

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.homeScore !== undefined) {
      data.homeScore = Number(body.homeScore);
    }

    if (body.awayScore !== undefined) {
      data.awayScore = Number(body.awayScore);
    }

    if (body.refereeName !== undefined) {
      data.refereeName = body.refereeName || null;
    }

    const match = await prisma.match.update({
      where: {
        id: matchId,
      },
      data,
    });

    return NextResponse.json({
      message: "Match updated successfully.",
      match,
    });
  } catch (error) {
    console.error("Update match error:", error);

    return NextResponse.json(
      { error: "Failed to update match." },
      { status: 500 },
    );
  }
}
