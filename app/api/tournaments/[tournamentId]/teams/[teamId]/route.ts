import { NextRequest, NextResponse } from "next/server";
import { updateTeam } from "@/server/tournaments/team.service";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type RouteContext = {
  params: Promise<{
    tournamentId: string;
    teamId: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdmin();

    const { tournamentId, teamId } = await params;
    const body = await request.json();
    const team = await updateTeam(tournamentId, teamId, {
      name: body.name,
    });

    return NextResponse.json(team);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update team.";

    return NextResponse.json(
      { error: message },
      { status: message === "Team not found." ? 404 : 400 },
    );
  }
}

import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    tournamentId: string;
    teamId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  try {
    const { tournamentId, teamId } = await params;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        tournamentId,
      },
      include: {
        group: true,
        tournament: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      group: team.group,
      settings: team.tournament.settings,
    });
  } catch (error) {
    console.error("Failed to fetch team:", error);

    return NextResponse.json(
      { error: "Failed to fetch team." },
      { status: 500 },
    );
  }
}
