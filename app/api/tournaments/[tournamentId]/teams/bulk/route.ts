import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTeam } from "@/server/tournaments/team.service";
import { requireAdmin } from "@/lib/auth/authorization";
import { authErrorResponse } from "@/lib/auth/api-auth";
import { parseCsv, normalizeHeader } from "@/lib/csv";

type RouteContext = {
  params: Promise<{
    tournamentId: string;
  }>;
};

type BulkError = {
  row: number;
  team: string;
  error: string;
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

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { groups: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    const rows = parseCsv(csv).filter((row) =>
      row.some((cell) => cell && cell.trim() !== ""),
    );

    if (rows.length < 1) {
      return NextResponse.json(
        {
          created: 0,
          skipped: 0,
          errors: [{ row: 1, team: "", error: "No CSV rows found." }],
        },
        { status: 400 },
      );
    }

    const header = rows[0].map(normalizeHeader);

    const nameIdx = header.indexOf("name");
    if (nameIdx === -1) {
      return NextResponse.json(
        {
          error: "CSV header must include a 'name' column.",
        },
        { status: 400 },
      );
    }

    const shortNameIdx = header.indexOf("shortname");
    const logoUrlIdx = header.indexOf(normalizeHeader("logoUrl"));
    const groupIdx = header.indexOf("group");

    const groupByName = new Map(
      tournament.groups.map((group) => [
        normalizeHeader(group.name),
        group.id,
      ]),
    );

    const created: string[] = [];
    let skipped = 0;
    const errors: BulkError[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      const name = (row[nameIdx] ?? "").trim();
      const shortName =
        shortNameIdx !== -1 ? (row[shortNameIdx] ?? "").trim() : "";
      const logoUrl =
        logoUrlIdx !== -1 ? (row[logoUrlIdx] ?? "").trim() : "";
      const groupName =
        groupIdx !== -1 ? (row[groupIdx] ?? "").trim() : "";

      if (!name) {
        skipped++;
        errors.push({
          row: rowNumber,
          team: "",
          error: "Missing team name.",
        });
        continue;
      }

      let groupId: string | null = null;

      if (groupName) {
        const foundGroupId = groupByName.get(normalizeHeader(groupName));

        if (!foundGroupId) {
          skipped++;
          errors.push({
            row: rowNumber,
            team: name,
            error: `Group "${groupName}" not found.`,
          });
          continue;
        }

        groupId = foundGroupId;
      }

      try {
        await createTeam(tournamentId, {
          name,
          shortName: shortName || undefined,
          logoUrl: logoUrl || undefined,
          groupId: groupId ?? undefined,
        });

        created.push(name);
      } catch (error) {
        skipped++;
        errors.push({
          row: rowNumber,
          team: name,
          error:
            error instanceof Error
              ? error.message
              : "Failed to create team.",
        });
      }
    }

    return NextResponse.json({
      created: created.length,
      skipped,
      errors,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to import teams.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
