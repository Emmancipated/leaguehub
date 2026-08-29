import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TournamentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type Context = {
  params: Promise<{
    tournamentId: string;
  }>;
};

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ["REGISTRATION", "CANCELLED"],
  REGISTRATION: ["SCHEDULED", "DRAFT", "CANCELLED"],
  SCHEDULED: ["LIVE", "REGISTRATION", "CANCELLED"],
  LIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT"],
};

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { tournamentId } = await params;

    const body = await request.json();
    const status = body.status as TournamentStatus;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "A valid status is required." },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    const allowed = allowedTransitions[tournament.status] ?? [];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot change tournament status from ${tournament.status} to ${status}.`,
        },
        { status: 400 },
      );
    }

    const updatedTournament = await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedTournament);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update tournament status." },
      { status: 500 },
    );
  }
}
