import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";
import { parseCsv, normalizeHeader } from "@/lib/csv";
import { bulkRegisterPlayers, BulkPlayerRow } from "@/server/tournaments/player.service";

type RouteContext = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdmin();

    const { tournamentId } = await params;

    const body = (await request.json()) as { csv?: string };

    const csv = typeof body?.csv === "string" ? body.csv : "";

    if (!csv.trim()) {
      return NextResponse.json(
        { error: "No CSV data provided." },
        { status: 400 },
      );
    }

    const rows = parseCsv(csv).filter((row) =>
      row.some((cell) => cell && cell.trim() !== ""),
    );

    const header = rows[0].map(normalizeHeader);

    const firstNameIdx = header.indexOf("firstname");
    const lastNameIdx = header.indexOf("lastname");

    if (firstNameIdx === -1) {
      return NextResponse.json(
        {
          error: "CSV header must include a 'firstName' column.",
        },
        { status: 400 },
      );
    }

    const displayNameIdx = header.indexOf("displayname");
    const jerseyNumberIdx = header.indexOf("jerseynumber");
    const dateOfBirthIdx = header.indexOf("dateofbirth");
    const phoneNumberIdx = header.indexOf("phonenumber");
    const teamIdx = header.indexOf("team");

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    const dataRows = rows.slice(1);

    if (dataRows.length === 0) {
      return NextResponse.json(
        {
          created: 0,
          skipped: 0,
          errors: [{ row: 2, error: "No player rows found." }],
        },
        { status: 400 },
      );
    }

    const bulkRows: BulkPlayerRow[] = dataRows.map((row) => ({
      firstName: (row[firstNameIdx] ?? "").trim(),
      lastName: lastNameIdx !== -1 ? (row[lastNameIdx] ?? "").trim() : "",
      displayName:
        displayNameIdx !== -1 && (row[displayNameIdx] ?? "").trim()
          ? (row[displayNameIdx] ?? "").trim()
          : null,
      jerseyNumber:
        jerseyNumberIdx !== -1 && (row[jerseyNumberIdx] ?? "").trim()
          ? Number(row[jerseyNumberIdx])
          : null,
      dateOfBirth:
        dateOfBirthIdx !== -1 && (row[dateOfBirthIdx] ?? "").trim()
          ? (row[dateOfBirthIdx] ?? "").trim()
          : null,
      phoneNumber:
        phoneNumberIdx !== -1 && (row[phoneNumberIdx] ?? "").trim()
          ? (row[phoneNumberIdx] ?? "").trim()
          : null,
      teamName:
        teamIdx !== -1 && (row[teamIdx] ?? "").trim()
          ? (row[teamIdx] ?? "").trim()
          : null,
    }));

    const result = await bulkRegisterPlayers(tournamentId, bulkRows);

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to import players.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
