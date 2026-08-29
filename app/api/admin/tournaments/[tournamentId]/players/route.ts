import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
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
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET players error:", error);

    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tournamentId } = await params;
    const body = await request.json();

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const teamId = body.teamId;

    if (!firstName || !lastName || !teamId) {
      return NextResponse.json(
        {
          error: "First name, last name and team are required",
        },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        settings: true,
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
            "Players can only be registered while the tournament is in draft status",
        },
        { status: 400 },
      );
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        tournamentId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found in this tournament" },
        { status: 404 },
      );
    }

    const existingPlayer = await prisma.player.findFirst({
      where: {
        tournamentId,
        firstName: {
          equals: firstName,
          mode: "insensitive",
        },
        lastName: {
          equals: lastName,
          mode: "insensitive",
        },
      },
      include: {
        teamRegistrations: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (existingPlayer) {
      if (existingPlayer.teamRegistrations.length > 0) {
        return NextResponse.json(
          {
            error:
              "This player is already registered to a team in this tournament",
          },
          { status: 409 },
        );
      }

      const registration = await prisma.teamPlayer.create({
        data: {
          teamId,
          playerId: existingPlayer.id,
        },
        include: {
          player: true,
          team: true,
        },
      });

      return NextResponse.json(registration, {
        status: 201,
      });
    }

    const player = await prisma.player.create({
      data: {
        tournamentId,
        firstName,
        lastName,
        displayName: body.displayName?.trim() || null,
        jerseyNumber:
          body.jerseyNumber !== undefined && body.jerseyNumber !== ""
            ? Number(body.jerseyNumber)
            : null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        phoneNumber: body.phoneNumber?.trim() || null,
        photoUrl: body.photoUrl?.trim() || null,
        registrationStatus: "ACTIVE",
      },
    });

    const registration = await prisma.teamPlayer.create({
      data: {
        teamId,
        playerId: player.id,
      },
      include: {
        player: true,
        team: true,
      },
    });

    return NextResponse.json(registration, {
      status: 201,
    });
  } catch (error) {
    console.error("POST player error:", error);

    return NextResponse.json(
      { error: "Failed to register player" },
      { status: 500 },
    );
  }
}
