import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { tournamentId } = await params;

    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
      },
      include: {
        homeTeam: {
          select: {
            name: true,
          },
        },
        awayTeam: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          roundNumber: "asc",
        },
        {
          matchNumber: "asc",
        },
      ],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load fixtures." },
      { status: 500 },
    );
  }
}
