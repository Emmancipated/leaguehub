import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  requireAdmin,
} from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type Context = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: Context,
) {
  try {
    await requireAdmin();

    const { tournamentId } = await params;
    const body = await request.json();

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const teamId = body.teamId ? String(body.teamId) : null;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        settings: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    if (teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          tournamentId,
          isActive: true,
        },
      });

      if (!team) {
        return NextResponse.json(
          { error: "Team not found." },
          { status: 404 },
        );
      }

      if (tournament.settings?.maximumPlayersPerTeam) {
        const playerCount = await prisma.teamPlayer.count({
          where: {
            teamId,
            isActive: true,
          },
        });

        if (
          playerCount >=
          tournament.settings.maximumPlayersPerTeam
        ) {
          return NextResponse.json(
            { error: "This team has reached its player limit." },
            { status: 400 },
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.player.create({
        data: {
          tournamentId,
          firstName,
          lastName,
          displayName: body.displayName?.trim() || null,
          jerseyNumber:
            body.jerseyNumber !== null &&
            body.jerseyNumber !== undefined &&
            body.jerseyNumber !== ""
              ? Number(body.jerseyNumber)
              : null,
          dateOfBirth: body.dateOfBirth
            ? new Date(body.dateOfBirth)
            : null,
          phoneNumber: body.phoneNumber?.trim() || null,
          registrationStatus: "ACTIVE",
        },
      });

      if (teamId) {
        await tx.teamPlayer.create({
          data: {
            teamId,
            playerId: player.id,
          },
        });
      }

      return player;
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Failed to register player:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to register player.",
      },
      { status: 400 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: Context,
) {
  try {
    await requireUser();

    const { tournamentId } = await params;

    const players = await prisma.player.findMany({
      where: {
        tournamentId,
      },
      include: {
        teamRegistrations: {
          where: {
            isActive: true,
          },
          include: {
            team: true,
          },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return NextResponse.json(players);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: "Failed to fetch players." },
      { status: 500 },
    );
  }
}
