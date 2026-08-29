import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    tournamentId: string;
    teamId: string;
  }>;
};

/**
 * GET
 * Return all active players registered to this team.
 */
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { tournamentId, teamId } = await params;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        tournamentId,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const players = await prisma.teamPlayer.findMany({
      where: {
        teamId,
        isActive: true,
      },
      include: {
        player: true,
      },
      orderBy: [
        {
          player: {
            lastName: "asc",
          },
        },
        {
          player: {
            firstName: "asc",
          },
        },
      ],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to fetch team players:", error);

    return NextResponse.json(
      { error: "Failed to fetch team players." },
      { status: 500 },
    );
  }
}

/**
 * POST
 * Assign a tournament player to this team.
 */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { tournamentId, teamId } = await params;
    const body = await request.json();

    const playerId = String(body.playerId ?? "").trim();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 },
      );
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        tournamentId,
        isActive: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        tournamentId,
      },
    });

    if (!player) {
      return NextResponse.json(
        {
          error: "Player not found in this tournament.",
        },
        { status: 404 },
      );
    }

    if (player.registrationStatus === "REMOVED") {
      return NextResponse.json(
        {
          error: "This player has been removed from the tournament.",
        },
        { status: 400 },
      );
    }

    /*
     * Check whether the player is already actively registered
     * to another team in this tournament.
     */
    const existingRegistration = await prisma.teamPlayer.findFirst({
      where: {
        playerId,
        isActive: true,
        team: {
          tournamentId,
        },
      },
      include: {
        team: true,
      },
    });

    if (existingRegistration) {
      if (existingRegistration.teamId === teamId) {
        return NextResponse.json(
          {
            error: "Player is already registered to this team.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error: `Player is already registered to ${existingRegistration.team.name}.`,
        },
        { status: 409 },
      );
    }

    /*
     * Check the configured maximum squad size.
     */
    const settings = await prisma.tournamentSettings.findUnique({
      where: {
        tournamentId,
      },
    });

    if (
      settings?.maximumPlayersPerTeam !== null &&
      settings?.maximumPlayersPerTeam !== undefined
    ) {
      const activePlayerCount = await prisma.teamPlayer.count({
        where: {
          teamId,
          isActive: true,
        },
      });

      if (activePlayerCount >= settings.maximumPlayersPerTeam) {
        return NextResponse.json(
          {
            error: `This team has reached its maximum of ${settings.maximumPlayersPerTeam} players.`,
          },
          { status: 400 },
        );
      }
    }

    /*
     * If a previous registration existed but was deactivated,
     * reactivate it instead of creating a duplicate.
     */
    const previousRegistration = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    let registration;

    if (previousRegistration) {
      registration = await prisma.teamPlayer.update({
        where: {
          id: previousRegistration.id,
        },
        data: {
          isActive: true,
          leftAt: null,
        },
        include: {
          player: true,
          team: true,
        },
      });
    } else {
      registration = await prisma.teamPlayer.create({
        data: {
          teamId,
          playerId,
          isActive: true,
        },
        include: {
          player: true,
          team: true,
        },
      });
    }

    return NextResponse.json(registration, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to assign player to team:", error);

    return NextResponse.json(
      { error: "Failed to assign player to team." },
      { status: 500 },
    );
  }
}

/**
 * DELETE
 * Remove a player from the team.
 *
 * We don't delete the TeamPlayer row. We deactivate it so
 * the registration history is preserved.
 */
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { tournamentId, teamId } = await params;
    const body = await request.json();

    const playerId = String(body.playerId ?? "").trim();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
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
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const registration = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (!registration || !registration.isActive) {
      return NextResponse.json(
        {
          error: "Player is not currently registered to this team.",
        },
        { status: 404 },
      );
    }

    const updatedRegistration = await prisma.teamPlayer.update({
      where: {
        id: registration.id,
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error("Failed to remove player from team:", error);

    return NextResponse.json(
      { error: "Failed to remove player from team." },
      { status: 500 },
    );
  }
}
