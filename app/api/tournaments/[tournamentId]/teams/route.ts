import { NextRequest, NextResponse } from "next/server";
import {
  getTournamentTeams,
  createTeam,
} from "@/server/tournaments/team.service";
import {
  requireUser,
  requireAdmin,
} from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";

type RouteContext = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireUser();

    const { tournamentId } = await params;

    const teams = await getTournamentTeams(tournamentId);

    return NextResponse.json(teams);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load teams.";

    return NextResponse.json(
      { error: message },
      { status: message === "Tournament not found." ? 404 : 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdmin();

    const { tournamentId } = await params;

    const body = await request.json();

    const team = await createTeam(tournamentId, {
      name: body.name,
      shortName: body.shortName,
      logoUrl: body.logoUrl,
      groupId: body.groupId,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create team.";

    const status =
      message === "Tournament not found." ||
      message === "Group not found."
        ? 404
        : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
