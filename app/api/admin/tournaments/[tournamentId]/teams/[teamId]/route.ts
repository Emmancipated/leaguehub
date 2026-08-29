import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    tournamentId: string;
    teamId: string;
  }>;
};

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { tournamentId, teamId } = await params;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        tournamentId,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    if (tournament.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Teams can only be removed while the tournament is in draft status",
        },
        { status: 400 },
      );
    }

    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE team error:", error);

    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}
