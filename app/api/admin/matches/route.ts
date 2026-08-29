import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tournamentId,
      homeTeamId,
      awayTeamId,
      groupId,
      matchNumber,
      roundNumber,
      scheduledAt,
      venue,
    } = body;

    if (!tournamentId || !homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { error: "Tournament and both teams are required." },
        { status: 400 },
      );
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: "Home and away teams must be different." },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: [homeTeamId, awayTeamId],
        },
        tournamentId,
        isActive: true,
      },
    });

    if (teams.length !== 2) {
      return NextResponse.json(
        { error: "Both teams must belong to this tournament." },
        { status: 400 },
      );
    }

    if (groupId) {
      const group = await prisma.tournamentGroup.findFirst({
        where: {
          id: groupId,
          tournamentId,
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Selected group does not belong to this tournament." },
          { status: 400 },
        );
      }
    }

    if (matchNumber !== null && matchNumber !== undefined) {
      const existingMatch = await prisma.match.findFirst({
        where: {
          tournamentId,
          matchNumber: Number(matchNumber),
        },
      });

      if (existingMatch) {
        return NextResponse.json(
          { error: "That match number is already in use." },
          { status: 409 },
        );
      }
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        homeTeamId,
        awayTeamId,
        groupId: groupId || null,
        matchNumber:
          matchNumber !== null && matchNumber !== undefined
            ? Number(matchNumber)
            : null,
        roundNumber:
          roundNumber !== null && roundNumber !== undefined
            ? Number(roundNumber)
            : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        venue: venue || null,
      },
    });

    return NextResponse.json(
      {
        message: "Match created successfully.",
        match,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create match error:", error);

    return NextResponse.json(
      { error: "Failed to create match." },
      { status: 500 },
    );
  }
}
