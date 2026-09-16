import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    matchId: string;
  }>;
};

const ALLOWED_TYPES = [
  "GOAL",
  "OWN_GOAL",
  "YELLOW_CARD",
  "SECOND_YELLOW",
  "RED_CARD",
  "SUBSTITUTION",
  "PENALTY_MISSED",
] as const;

type EventType = (typeof ALLOWED_TYPES)[number];

function isValidEventType(value: unknown): value is EventType {
  return (
    typeof value === "string" && ALLOWED_TYPES.includes(value as EventType)
  );
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { matchId } = await params;
    const body = await request.json();

    const {
      type,
      playerId,
      teamId,
      matchPlayerId,
      assistedByPlayerId,
      assistedByMatchPlayerId,
      minute,
      addedTime,
      description,
    } = body;

    if (!isValidEventType(type)) {
      return NextResponse.json(
        { error: "Invalid event type." },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    if (match.status !== "LIVE" && match.status !== "HALF_TIME") {
      return NextResponse.json(
        {
          error:
            "Events can only be added while the match is live or at half time.",
        },
        { status: 400 },
      );
    }

    let resolvedPlayerId: string | null = null;
    let resolvedMatchPlayerId: string | null = null;
    let playerTeamId: string | null = null;

    if (matchPlayerId) {
      const matchPlayer = await prisma.matchPlayer.findFirst({
        where: { id: matchPlayerId, matchId },
        select: { id: true, playerId: true, teamId: true },
      });

      if (!matchPlayer) {
        return NextResponse.json(
          { error: "Selected match-only player was not found." },
          { status: 400 },
        );
      }

      resolvedMatchPlayerId = matchPlayer.id;
      resolvedPlayerId = matchPlayer.playerId;
      playerTeamId = matchPlayer.teamId;
    }

    if (playerId && !matchPlayerId) {
      const registration = await prisma.teamPlayer.findFirst({
        where: {
          playerId,
          teamId: teamId || { in: [match.homeTeamId, match.awayTeamId] },
          isActive: true,
          player: {
            tournamentId: match.tournamentId,
          },
        },
      });

      if (!registration) {
        return NextResponse.json(
          {
            error:
              "Selected player does not belong to either team in this match.",
          },
          { status: 400 },
        );
      }

      resolvedPlayerId = playerId;
      playerTeamId = registration.teamId;
    }

    /*
     * Goals and own goals need a player so that we can determine
     * which team should receive the score.
     */
    if ((type === "GOAL" || type === "OWN_GOAL") && !playerTeamId) {
      return NextResponse.json(
        {
          error: "A player must be selected when recording a goal or own goal.",
        },
        { status: 400 },
      );
    }

    let resolvedAssistedByPlayerId: string | null = null;
    let resolvedAssistedByMatchPlayerId: string | null = null;

    if (assistedByPlayerId || assistedByMatchPlayerId) {
      if (type !== "GOAL") {
        return NextResponse.json(
          { error: "Only a goal can have an assist." },
          { status: 400 },
        );
      }

      let assisterTeamId: string | null = null;

      if (assistedByMatchPlayerId) {
        const assister = await prisma.matchPlayer.findFirst({
          where: { id: assistedByMatchPlayerId, matchId },
          select: { id: true, playerId: true, teamId: true },
        });

        if (!assister) {
          return NextResponse.json(
            { error: "Selected assisting match-only player was not found." },
            { status: 400 },
          );
        }

        resolvedAssistedByMatchPlayerId = assister.id;
        assisterTeamId = assister.teamId;
      } else {
        const registration = await prisma.teamPlayer.findFirst({
          where: {
            playerId: assistedByPlayerId,
            teamId: { in: [match.homeTeamId, match.awayTeamId] },
            isActive: true,
            player: { tournamentId: match.tournamentId },
          },
        });

        if (!registration) {
          return NextResponse.json(
            { error: "Selected assisting player is not in this match." },
            { status: 400 },
          );
        }

        resolvedAssistedByPlayerId = assistedByPlayerId;
        assisterTeamId = registration.teamId;
      }

      if (assisterTeamId !== playerTeamId) {
        return NextResponse.json(
          { error: "The assisting player must be on the scoring team." },
          { status: 400 },
        );
      }

      if (
        resolvedAssistedByPlayerId === resolvedPlayerId &&
        resolvedAssistedByMatchPlayerId === resolvedMatchPlayerId
      ) {
        return NextResponse.json(
          { error: "The scorer and assisting player must be different." },
          { status: 400 },
        );
      }
    }

    const parsedMinute =
      minute !== null && minute !== undefined && minute !== ""
        ? Number(minute)
        : null;

    const parsedAddedTime =
      addedTime !== null && addedTime !== undefined && addedTime !== ""
        ? Number(addedTime)
        : null;

    if (
      parsedMinute !== null &&
      (!Number.isInteger(parsedMinute) || parsedMinute < 0)
    ) {
      return NextResponse.json(
        { error: "Minute must be a non-negative integer." },
        { status: 400 },
      );
    }

    if (
      parsedAddedTime !== null &&
      (!Number.isInteger(parsedAddedTime) || parsedAddedTime < 0)
    ) {
      return NextResponse.json(
        { error: "Added time must be a non-negative integer." },
        { status: 400 },
      );
    }

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.matchEvent.create({
        data: {
          matchId,
          playerId: resolvedPlayerId,
          matchPlayerId: resolvedMatchPlayerId,
          assistedByPlayerId: resolvedAssistedByPlayerId,
          assistedByMatchPlayerId: resolvedAssistedByMatchPlayerId,
          teamId: playerTeamId,
          type,
          minute: parsedMinute,
          addedTime: parsedAddedTime,
          description:
            typeof description === "string" && description.trim()
              ? description.trim()
              : null,
        },
        include: {
          player: true,
          matchPlayer: { include: { team: true } },
          assistedByPlayer: true,
          assistedByMatchPlayer: { include: { team: true } },
        },
      });

      /*
       * Update the match score for goals.
       */
      if ((type === "GOAL" || type === "OWN_GOAL") && playerTeamId) {
        const playerScoredForHome = playerTeamId === match.homeTeamId;

        /*
         * Normal goal:
         *   player's own team gets the goal.
         *
         * Own goal:
         *   opposing team gets the goal.
         */
        const scoringHomeTeam =
          type === "GOAL" ? playerScoredForHome : !playerScoredForHome;

        await tx.match.update({
          where: {
            id: matchId,
          },
          data: scoringHomeTeam
            ? {
                homeScore: {
                  increment: 1,
                },
              }
            : {
                awayScore: {
                  increment: 1,
                },
              },
        });
      }

      return createdEvent;
    });

    return NextResponse.json(
      {
        message: "Match event recorded successfully.",
        event,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create match event error:", error);

    return NextResponse.json(
      { error: "Failed to record match event." },
      { status: 500 },
    );
  }
}
