import { NextRequest, NextResponse } from "next/server";
import {
  createTournament,
  type CreateTournamentInput,
} from "@/server/tournaments/tournament.service";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          error: "name and slug are required.",
        },
        { status: 400 },
      );
    }

    if (!body.numberOfTeams || body.numberOfTeams < 2) {
      return NextResponse.json(
        {
          error: "numberOfTeams must be at least 2.",
        },
        { status: 400 },
      );
    }

    // Temporary development user.
    // This will be replaced with the authenticated user later.
    const developmentUser = await prisma.user.upsert({
      where: {
        email: "admin@leaguehub.local",
      },
      update: {},
      create: {
        name: "LeagueHub Admin",
        email: "admin@leaguehub.local",
        role: "SUPER_ADMIN",
      },
    });

    const input: CreateTournamentInput = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      createdById: developmentUser.id,

      startDate: body.startDate ? new Date(body.startDate) : undefined,

      endDate: body.endDate ? new Date(body.endDate) : undefined,

      competitionFormat: body.competitionFormat ?? "LEAGUE",

      roundRobinType: body.roundRobinType ?? "SINGLE",

      numberOfTeams: Number(body.numberOfTeams),

      minimumPlayersPerTeam: body.minimumPlayersPerTeam
        ? Number(body.minimumPlayersPerTeam)
        : undefined,

      maximumPlayersPerTeam: body.maximumPlayersPerTeam
        ? Number(body.maximumPlayersPerTeam)
        : undefined,

      playersOnPitch: body.playersOnPitch
        ? Number(body.playersOnPitch)
        : undefined,

      outfieldPlayers: body.outfieldPlayers
        ? Number(body.outfieldPlayers)
        : undefined,

      matchDurationMinutes: body.matchDurationMinutes
        ? Number(body.matchDurationMinutes)
        : undefined,

      halfTimeDurationMinutes: body.halfTimeDurationMinutes
        ? Number(body.halfTimeDurationMinutes)
        : undefined,

      rollingSubstitutions: body.rollingSubstitutions,

      offsideEnabled: body.offsideEnabled,

      goalkeeperBackPassEnabled: body.goalkeeperBackPassEnabled,

      designatedSubstitutionArea: body.designatedSubstitutionArea,

      winPoints:
        body.winPoints !== undefined ? Number(body.winPoints) : undefined,

      drawPoints:
        body.drawPoints !== undefined ? Number(body.drawPoints) : undefined,

      lossPoints:
        body.lossPoints !== undefined ? Number(body.lossPoints) : undefined,

      tieBreaker1: body.tieBreaker1,
      tieBreaker2: body.tieBreaker2,
      tieBreaker3: body.tieBreaker3,
      tieBreaker4: body.tieBreaker4,
      tieBreaker5: body.tieBreaker5,

      registrationOpensAt: body.registrationOpensAt
        ? new Date(body.registrationOpensAt)
        : undefined,

      registrationClosesAt: body.registrationClosesAt
        ? new Date(body.registrationClosesAt)
        : undefined,
    };

    const tournament = await createTournament(input);

    return NextResponse.json(
      {
        success: true,
        tournament,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create tournament." },
      { status: 500 },
    );
  }
}
