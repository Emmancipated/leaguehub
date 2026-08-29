import { NextResponse } from "next/server";
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
