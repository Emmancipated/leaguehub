import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type Params = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();

    const { matchId } = await params;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const teamId = typeof body.teamId === "string" ? body.teamId : "";
    const playerId = typeof body.playerId === "string" ? body.playerId : null;

    if (!name || !teamId) {
      return NextResponse.json(
        { error: "Player name and team are required." },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        tournamentId: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
      return NextResponse.json(
        { error: "The selected team is not playing this match." },
        { status: 400 },
      );
    }

    let linkedPlayerId: string | null = null;

    if (playerId) {
      const player = await prisma.player.findFirst({
        where: { id: playerId, tournamentId: match.tournamentId },
        select: { id: true },
      });

      if (!player) {
        return NextResponse.json(
          { error: "The selected player does not belong to this tournament." },
          { status: 400 },
        );
      }

      linkedPlayerId = player.id;
    }

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        teamId,
        playerId: linkedPlayerId,
        name,
      },
      include: { team: true, player: true },
    });

    return NextResponse.json(matchPlayer, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Add match player error:", error);

    return NextResponse.json(
      { error: "Failed to add match player." },
      { status: 500 },
    );
  }
}
