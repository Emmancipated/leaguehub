import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    matchId: string;
    eventId: string;
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

function parseMinute(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const minute = Number(value);

  if (!Number.isInteger(minute) || minute < 0) {
    return undefined;
  }

  return minute;
}

function parseAddedTime(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const addedTime = Number(value);

  if (!Number.isInteger(addedTime) || addedTime < 0) {
    return undefined;
  }

  return addedTime;
}

/**
 * Determines which team receives the goal.
 *
 * GOAL:
 *   Player's team gets the goal.
 *
 * OWN_GOAL:
 *   Opposing team gets the goal.
 */
function getScoringTeamId(
  type: EventType,
  playerTeamId: string | null,
  homeTeamId: string,
  awayTeamId: string,
) {
  if ((type !== "GOAL" && type !== "OWN_GOAL") || !playerTeamId) {
    return null;
  }

  const playerIsHome = playerTeamId === homeTeamId;

  if (type === "GOAL") {
    return playerIsHome ? homeTeamId : awayTeamId;
  }

  return playerIsHome ? awayTeamId : homeTeamId;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { matchId, eventId } = await params;
    const body = await request.json();

    const existingEvent = await prisma.matchEvent.findFirst({
      where: {
        id: eventId,
        matchId,
      },
      include: {
        match: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Match event not found." },
        { status: 404 },
      );
    }

    const match = existingEvent.match;

    /*
     * Get the values that are being changed.
     * If a field is omitted, retain the existing value.
     */
    const newType = body.type !== undefined ? body.type : existingEvent.type;

    const newPlayerId =
      body.playerId !== undefined
        ? body.playerId || null
        : existingEvent.playerId;

    const newMatchPlayerId =
      body.matchPlayerId !== undefined
        ? body.matchPlayerId || null
        : existingEvent.matchPlayerId;

    const newMinute =
      body.minute !== undefined
        ? parseMinute(body.minute)
        : existingEvent.minute;

    const newAddedTime =
      body.addedTime !== undefined
        ? parseAddedTime(body.addedTime)
        : existingEvent.addedTime;

    const newDescription =
      body.description !== undefined
        ? typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null
        : existingEvent.description;

    if (!isValidEventType(newType)) {
      return NextResponse.json(
        { error: "Invalid event type." },
        { status: 400 },
      );
    }

    if (newMinute === undefined) {
      return NextResponse.json(
        { error: "Minute must be a non-negative integer." },
        { status: 400 },
      );
    }

    if (newAddedTime === undefined) {
      return NextResponse.json(
        { error: "Added time must be a non-negative integer." },
        { status: 400 },
      );
    }

    /*
     * If a player is supplied, make sure that player belongs
     * to one of the teams in this match.
     */
    let newPlayerTeamId: string | null = null;

    if (newMatchPlayerId) {
      const matchPlayer = await prisma.matchPlayer.findFirst({
        where: { id: newMatchPlayerId, matchId },
        select: { id: true, playerId: true, teamId: true },
      });

      if (!matchPlayer) {
        return NextResponse.json(
          { error: "Selected match-only player was not found." },
          { status: 400 },
        );
      }

      newPlayerTeamId = matchPlayer.teamId;
    }

    if (newPlayerId && !newMatchPlayerId) {
      const registration = await prisma.teamPlayer.findFirst({
        where: {
          playerId: newPlayerId,
          teamId: {
            in: [match.homeTeamId, match.awayTeamId],
          },
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

      newPlayerTeamId = registration.teamId;
    }

    /*
     * Goals must have a player because the player's team
     * determines who gets the goal.
     */
    if ((newType === "GOAL" || newType === "OWN_GOAL") && !newPlayerTeamId) {
      return NextResponse.json(
        {
          error: "A player must be selected when recording a goal or own goal.",
        },
        { status: 400 },
      );
    }

    /*
     * Find the team that originally received the goal.
     */
    let oldPlayerTeamId: string | null = null;

    if (existingEvent.teamId) {
      oldPlayerTeamId = existingEvent.teamId;
    } else if (existingEvent.playerId) {
      const oldRegistration = await prisma.teamPlayer.findFirst({
        where: {
          playerId: existingEvent.playerId,
          teamId: {
            in: [match.homeTeamId, match.awayTeamId],
          },
          isActive: true,
          player: {
            tournamentId: match.tournamentId,
          },
        },
      });

      if (oldRegistration) {
        oldPlayerTeamId = oldRegistration.teamId;
      }
    }

    const oldScoringTeamId = getScoringTeamId(
      existingEvent.type as EventType,
      oldPlayerTeamId,
      match.homeTeamId,
      match.awayTeamId,
    );

    const newScoringTeamId = getScoringTeamId(
      newType,
      newPlayerTeamId,
      match.homeTeamId,
      match.awayTeamId,
    );

    const updatedEvent = await prisma.$transaction(async (tx) => {
      /*
       * If the old event was a goal, remove its contribution
       * from the score first.
       */
      if (oldScoringTeamId === match.homeTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            homeScore: {
              decrement: 1,
            },
          },
        });
      }

      if (oldScoringTeamId === match.awayTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            awayScore: {
              decrement: 1,
            },
          },
        });
      }

      /*
       * Update the event.
       */
      const event = await tx.matchEvent.update({
        where: {
          id: eventId,
        },
        data: {
          type: newType,
          playerId: newPlayerId,
          matchPlayerId: newMatchPlayerId,
          teamId: newPlayerTeamId,
          minute: newMinute,
          addedTime: newAddedTime,
          description: newDescription,
        },
        include: {
          player: true,
        },
      });

      /*
       * Apply the new goal contribution.
       */
      if (newScoringTeamId === match.homeTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            homeScore: {
              increment: 1,
            },
          },
        });
      }

      if (newScoringTeamId === match.awayTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            awayScore: {
              increment: 1,
            },
          },
        });
      }

      return event;
    });

    return NextResponse.json({
      message: "Match event updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Update match event error:", error);

    return NextResponse.json(
      { error: "Failed to update match event." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { matchId, eventId } = await params;

    const existingEvent = await prisma.matchEvent.findFirst({
      where: {
        id: eventId,
        matchId,
      },
      include: {
        match: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Match event not found." },
        { status: 404 },
      );
    }

    const match = existingEvent.match;

    let playerTeamId: string | null = null;

    if (existingEvent.playerId) {
      const registration = await prisma.teamPlayer.findFirst({
        where: {
          playerId: existingEvent.playerId,
          teamId: {
            in: [match.homeTeamId, match.awayTeamId],
          },
          isActive: true,
          player: {
            tournamentId: match.tournamentId,
          },
        },
      });

      if (registration) {
        playerTeamId = registration.teamId;
      }
    }

    const scoringTeamId = getScoringTeamId(
      existingEvent.type as EventType,
      playerTeamId,
      match.homeTeamId,
      match.awayTeamId,
    );

    await prisma.$transaction(async (tx) => {
      /*
       * Remove the goal from the score.
       */
      if (scoringTeamId === match.homeTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            homeScore: {
              decrement: 1,
            },
          },
        });
      }

      if (scoringTeamId === match.awayTeamId) {
        await tx.match.update({
          where: {
            id: matchId,
          },
          data: {
            awayScore: {
              decrement: 1,
            },
          },
        });
      }

      /*
       * Delete the event.
       */
      await tx.matchEvent.delete({
        where: {
          id: eventId,
        },
      });
    });

    return NextResponse.json({
      message: "Match event deleted successfully.",
    });
  } catch (error) {
    console.error("Delete match event error:", error);

    return NextResponse.json(
      { error: "Failed to delete match event." },
      { status: 500 },
    );
  }
}
