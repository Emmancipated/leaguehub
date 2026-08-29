import { NextResponse } from "next/server";
import { generateFixtures } from "@/server/tournaments/fixture.service";

type Params = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function POST(_request: Request, { params }: Params) {
  try {
    const { tournamentId } = await params;

    const result = await generateFixtures(tournamentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate fixtures.",
      },
      { status: 400 },
    );
  }
}
