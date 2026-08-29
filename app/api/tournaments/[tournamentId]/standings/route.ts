import { NextResponse } from "next/server";
import { getStandings } from "@/server/tournaments/standings.service";

type Context = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { tournamentId } = await params;

    const standings = await getStandings(tournamentId);

    return NextResponse.json(standings);
  } catch (error) {
    console.error("Failed to fetch standings:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch standings.";

    const status = message === "Tournament not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
