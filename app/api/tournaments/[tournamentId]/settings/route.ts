import { NextRequest, NextResponse } from "next/server";
import {
  getTournamentSettings,
  updateTournamentSettings,
} from "@/server/tournaments/settings.service";
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

    const settings = await getTournamentSettings(tournamentId);

    return NextResponse.json(settings);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load settings.";

    const status =
      message === "Tournament not found." ? 404 : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdmin();

    const { tournamentId } = await params;

    const body = await request.json();

    const settings = await updateTournamentSettings(
      tournamentId,
      body,
    );

    return NextResponse.json(settings);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update settings.";

    const status =
      message === "Tournament not found." ? 404 : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
