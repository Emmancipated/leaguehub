"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CircleAlert, RefreshCw } from "lucide-react";

import {
  matchStatusClasses,
  matchStatusLabel,
  teamInitials,
  eventLabel,
} from "@/lib/match-utils";

type Team = {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
};

type Player = {
  id: string;
  firstName: string;
  lastName: string;
};

type MatchEvent = {
  id: string;
  type: string;
  minute: number | null;
  addedTime: number | null;
  description: string | null;
  player: Player | null;
  assistedByPlayer: Player | null;
  assistedByMatchPlayer: { name: string } | null;
  matchPlayer: { id: string; name: string } | null;
  team?: Team | null;
};

type MatchData = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: Team;
  awayTeam: Team;
  events: MatchEvent[];
};

type Props = {
  tournamentId: string;
  matchId: string;
  initialMatch: MatchData;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function minuteLabel(minute: number | null, addedTime: number | null): string {
  if (minute === null) return "—";

  return `${minute}'${addedTime ? `+${addedTime}` : ""}`;
}

function isGoalEvent(event: MatchEvent): boolean {
  return event.type === "GOAL" || event.type === "OWN_GOAL";
}

function isYellowCard(event: MatchEvent): boolean {
  return event.type === "YELLOW_CARD";
}

function isSecondYellow(event: MatchEvent): boolean {
  return event.type === "SECOND_YELLOW";
}

function isRedCard(event: MatchEvent): boolean {
  return event.type === "RED_CARD" || event.type === "SECOND_YELLOW";
}

function isCardEvent(event: MatchEvent): boolean {
  return (
    isYellowCard(event) || isSecondYellow(event) || event.type === "RED_CARD"
  );
}

function eventPlayerName(event: MatchEvent): string {
  if (event.player) {
    return `${event.player.firstName} ${event.player.lastName}`;
  }
  if (event.matchPlayer) {
    return event.matchPlayer.name;
  }
  return "";
}

function getEventTeamId(
  event: MatchEvent,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  /*
   * For an own goal, the player belongs to the team that
   * conceded the goal, so the goal is displayed on the
   * opposition side.
   */
  if (event.type === "OWN_GOAL" && event.team) {
    if (event.team.id === homeTeamId) {
      return awayTeamId;
    }

    if (event.team.id === awayTeamId) {
      return homeTeamId;
    }
  }

  return event.team?.id ?? null;
}

function sortEvents(events: MatchEvent[]): MatchEvent[] {
  return [...events].sort((a, b) => {
    const aMinute = a.minute ?? Number.MAX_SAFE_INTEGER;
    const bMinute = b.minute ?? Number.MAX_SAFE_INTEGER;

    if (aMinute !== bMinute) {
      return aMinute - bMinute;
    }

    const aAddedTime = a.addedTime ?? 0;
    const bAddedTime = b.addedTime ?? 0;

    return aAddedTime - bAddedTime;
  });
}

/* -------------------------------------------------------------------------- */
/* Modern Event Icon                                                          */
/* -------------------------------------------------------------------------- */

function MatchEventIcon({ event }: { event: MatchEvent }) {
  const type = event.type;

  /* ------------------------------------------------------------------------ */
  /* Goal                                                                     */
  /* ------------------------------------------------------------------------ */

  if (type === "GOAL") {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center"
        title="Goal"
        aria-label="Goal"
      >
        <Image
          src="/icons8-soccer-ball.gif"
          alt="Goal"
          width={20}
          height={20}
        />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Own Goal                                                                 */
  /* ------------------------------------------------------------------------ */

  if (type === "OWN_GOAL") {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center"
        title="Own Goal"
        aria-label="Own Goal"
      >
        <Image
          src="/icons8-football-48.png"
          alt="Own Goal"
          width={20}
          height={20}
        />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Yellow Card                                                              */
  /* ------------------------------------------------------------------------ */

  if (type === "YELLOW_CARD") {
    return (
      <span
        className="flex h-9 w-9 items-center justify-center"
        title="Yellow Card"
        aria-label="Yellow Card"
      >
        <span className="h-6 w-4 rounded-[3px] border border-yellow-500 bg-yellow-300 shadow-sm" />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Second Yellow -> Red Card                                                */
  /* ------------------------------------------------------------------------ */

  if (type === "SECOND_YELLOW") {
    return (
      <span
        className="relative flex h-9 w-9 items-center justify-center"
        title="Second Yellow / Red Card"
        aria-label="Second Yellow / Red Card"
      >
        {/* First yellow card */}
        <span className="absolute left-1.75 top-1.75 h-6 w-4 rotate-[-8deg] rounded-[3px] border border-yellow-500 bg-yellow-300 shadow-sm" />

        {/* Red card */}
        <span className="absolute right-1.25 bottom-1.25 h-6 w-4 rotate-[8deg] rounded-[3px] border border-red-500 bg-red-500 shadow-sm" />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Straight Red Card                                                        */
  /* ------------------------------------------------------------------------ */

  if (type === "RED_CARD") {
    return (
      <span
        className="flex h-9 w-9 items-center justify-center"
        title="Red Card"
        aria-label="Red Card"
      >
        <span className="h-6 w-4 rounded-[3px] border border-red-500 bg-red-500 shadow-sm" />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Substitution                                                             */
  /* ------------------------------------------------------------------------ */

  if (type === "SUBSTITUTION") {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center"
        title="Substitution"
        aria-label="Substitution"
      >
        <Image
          src="/icons8-arrows-48.png"
          alt="Substitution"
          width={20}
          height={20}
        />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Penalty Missed                                                           */
  /* ------------------------------------------------------------------------ */

  if (type === "PENALTY_MISSED") {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center"
        title="Penalty Missed"
        aria-label="Penalty Missed"
      >
        <Image
          src="/icons8-missed-penalty-30.png"
          alt="Penalty Missed"
          width={20}
          height={20}
        />
      </span>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Unknown / future event                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
      title={eventLabel(type)}
      aria-label={eventLabel(type)}
    >
      <CircleAlert className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline Break                                                             */
/* -------------------------------------------------------------------------- */

function TimelineBreak({
  label,
  score,
}: {
  label: "HT" | "FT";
  score: string;
}) {
  return (
    <div className="grid min-h-19 grid-cols-[58px_1fr_auto_1fr] items-center bg-slate-50 px-4 sm:grid-cols-[70px_1fr_110px_1fr] sm:px-6">
      <div>
        <span className="text-sm font-semibold text-slate-500 sm:text-base">
          {label}
        </span>
      </div>

      <div />

      <div className="text-center">
        <span className="text-base font-bold text-slate-950 sm:text-lg">
          {score}
        </span>
      </div>

      <div />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline Event Row                                                         */
/* -------------------------------------------------------------------------- */

function TimelineEventRow({
  event,
  isHomeEvent,
  isAwayEvent,
  homeScore,
  awayScore,
}: {
  event: MatchEvent;
  isHomeEvent: boolean;
  isAwayEvent: boolean;
  homeScore: number;
  awayScore: number;
}) {
  const minute = minuteLabel(event.minute, event.addedTime);

  const playerName = eventPlayerName(event);

  const isGoal = isGoalEvent(event);
  const isCard = isCardEvent(event);

  const isSubstitution = event.type === "SUBSTITUTION";
  const isPenaltyMissed = event.type === "PENALTY_MISSED";

  const label = eventLabel(event.type);

  const awayEventContent =
    isSubstitution || isPenaltyMissed ? (
      <>
        <MatchEventIcon event={event} />
        <div className="ml-2 min-w-0">
          <p className="truncate text-sm sm:text-base font-semibold text-slate-800">
            {playerName}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">{label}</p>
        </div>
      </>
    ) : (
      <>
        {!isGoal && <MatchEventIcon event={event} />}
        <div className="min-w-0">
          <p
            className={`truncate text-sm sm:text-base ${
              isGoal
                ? "font-bold text-slate-950"
                : "font-semibold text-slate-800"
            }`}
          >
            {playerName || label}
          </p>

          {/* Goal type */}
          {isGoal && (
            <p
              className={`mt-0.5 truncate text-[10px] ${
                event.type === "OWN_GOAL"
                  ? "font-medium text-red-600"
                  : "text-slate-400"
              }`}
            >
              {label}
            </p>
          )}

          {/* Assist */}
          {isGoal && event.assistedByPlayer && (
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              Assist: {event.assistedByPlayer.firstName}{" "}
              {event.assistedByPlayer.lastName}
            </p>
          )}

          {/* Match player assist fallback */}
          {isGoal && event.assistedByMatchPlayer && !event.assistedByPlayer && (
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              Assist: {event.assistedByMatchPlayer.name}
            </p>
          )}

          {/* Event description */}
          {event.description && (
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              {event.description}
            </p>
          )}
        </div>
      </>
    );

  return (
    <div className="grid min-h-20.5 grid-cols-[58px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 bg-white px-4 sm:grid-cols-[70px_minmax(0,1fr)_110px_minmax(0,1fr)] sm:px-6">
      {/* ================================================================== */}
      {/* Minute                                                             */}
      {/* ================================================================== */}

      <div className="text-left">
        <span className="text-sm font-semibold text-slate-500 sm:text-base">
          {minute}
        </span>
      </div>

      {/* ================================================================== */}
      {/* Home Event                                                         */}
      {/* ================================================================== */}

      <div className="min-w-0 text-right">
        {isHomeEvent && (
          <div className="flex items-center justify-end gap-3">
            {/* Event information */}
            {!isSubstitution && !isPenaltyMissed && (
              <div className="min-w-0">
                <p
                  className={`truncate text-sm sm:text-base ${
                    isGoal
                      ? "font-bold text-slate-950"
                      : "font-semibold text-slate-800"
                  }`}
                >
                  {playerName || label}
                </p>

                {/* Goal type */}
                {isGoal && (
                  <p
                    className={`mt-0.5 truncate text-[10px] ${
                      event.type === "OWN_GOAL"
                        ? "font-medium text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {label}
                  </p>
                )}

                {/* Assist */}
                {isGoal && event.assistedByPlayer && (
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    Assist: {event.assistedByPlayer.firstName}{" "}
                    {event.assistedByPlayer.lastName}
                  </p>
                )}

                {/* Match player assist fallback */}
                {isGoal &&
                  event.assistedByMatchPlayer &&
                  !event.assistedByPlayer && (
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      Assist: {event.assistedByMatchPlayer.name}
                    </p>
                  )}

                {/* Event description */}
                {event.description && (
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {event.description}
                  </p>
                )}
              </div>
            )}

            {/* Icon for non-goal events */}
            {!isGoal && isCard && <MatchEventIcon event={event} />}

            {!isGoal && !isCard && !isSubstitution && !isPenaltyMissed && (
              <MatchEventIcon event={event} />
            )}

            {isSubstitution || isPenaltyMissed ? (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm sm:text-base font-semibold text-slate-800">
                    {playerName}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {label}
                  </p>
                </div>
                <MatchEventIcon event={event} />
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* Center                                                             */}
      {/* ================================================================== */}

      <div className="flex min-w-18 items-center justify-center gap-3">
        {isGoal ? (
          <>
            <MatchEventIcon event={event} />

            <span className="min-w-10.5 text-center text-sm font-bold text-slate-950 sm:text-base">
              {homeScore} - {awayScore}
            </span>
          </>
        ) : (
          <span className="w-18" />
        )}
      </div>

      {/* ================================================================== */}
      {/* Away Event                                                         */}
      {/* ================================================================== */}

      <div className="min-w-0 text-left">
        {isAwayEvent && (
          <div className="flex items-center gap-3">{awayEventContent}</div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Match Timeline                                                             */
/* -------------------------------------------------------------------------- */

function MatchTimeline({
  events,
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
  isFinished,
  isHalfTime,
}: {
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
  isHalfTime: boolean;
}) {
  const sortedEvents = sortEvents(events);

  const timelineRows: React.ReactNode[] = [];

  let runningHomeScore = 0;
  let runningAwayScore = 0;

  let hasInsertedHalfTime = false;

  for (const event of sortedEvents) {
    /*
     * Your tournament uses 15-minute halves.
     */
    const isSecondHalf = event.minute !== null && event.minute > 15;

    if (isSecondHalf && !hasInsertedHalfTime) {
      timelineRows.push(
        <TimelineBreak
          key="half-time"
          label="HT"
          score={`${runningHomeScore} - ${runningAwayScore}`}
        />,
      );

      hasInsertedHalfTime = true;
    }

    const eventTeamId = getEventTeamId(event, homeTeamId, awayTeamId);

    const isHomeEvent = eventTeamId === homeTeamId;
    const isAwayEvent = eventTeamId === awayTeamId;

    /*
     * Update score for GOAL and OWN_GOAL.
     */
    if (isGoalEvent(event)) {
      if (isHomeEvent) {
        runningHomeScore += 1;
      } else if (isAwayEvent) {
        runningAwayScore += 1;
      }
    }

    timelineRows.push(
      <TimelineEventRow
        key={event.id}
        event={event}
        isHomeEvent={isHomeEvent}
        isAwayEvent={isAwayEvent}
        homeScore={runningHomeScore}
        awayScore={runningAwayScore}
      />,
    );
  }

  /*
   * Match is currently at half time.
   */
  if (isHalfTime && !hasInsertedHalfTime) {
    timelineRows.push(
      <TimelineBreak
        key="half-time"
        label="HT"
        score={`${homeScore} - ${awayScore}`}
      />,
    );
  }

  /*
   * Completed match.
   */
  if (isFinished) {
    timelineRows.push(
      <TimelineBreak
        key="full-time"
        label="FT"
        score={`${homeScore} - ${awayScore}`}
      />,
    );
  }

  return <div className="divide-y divide-slate-200">{timelineRows}</div>;
}

/* -------------------------------------------------------------------------- */
/* Live Match                                                                 */
/* -------------------------------------------------------------------------- */

export default function LiveMatch({
  tournamentId,
  matchId,
  initialMatch,
}: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Live polling                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (match.status !== "LIVE") {
      return;
    }

    let cancelled = false;

    async function refreshMatch() {
      try {
        setIsRefreshing(true);

        const response = await fetch(
          `/api/tournaments/${tournamentId}/matches/${matchId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setMatch(data);
        }
      } catch {
        // Silently ignore temporary polling failures.
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    const interval = window.setInterval(refreshMatch, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [tournamentId, matchId, match.status]);

  /* ------------------------------------------------------------------------ */
  /* Match state                                                              */
  /* ------------------------------------------------------------------------ */

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "COMPLETED";

  const showScore = !(
    match.status === "SCHEDULED" || match.status === "POSTPONED"
  );

  /* ------------------------------------------------------------------------ */
  /* Score colours                                                            */
  /* ------------------------------------------------------------------------ */

  const scoreClasses =
    match.homeScore > match.awayScore
      ? {
          home: "text-emerald-600",
          away: "text-rose-600",
        }
      : match.awayScore > match.homeScore
        ? {
            home: "text-rose-600",
            away: "text-emerald-600",
          }
        : {
            home: "text-slate-950",
            away: "text-slate-950",
          };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* ==================================================================== */}
      {/* SCOREBOARD                                                           */}
      {/* ==================================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Match status */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${matchStatusClasses(
              match.status,
            )}`}
          >
            {isLive && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            )}

            {matchStatusLabel(match.status)}
          </span>
        </div>

        {/* Teams + score */}
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:mt-8 sm:gap-10">
          {/* Home */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 sm:h-24 sm:w-24 sm:text-2xl">
              {match.homeTeam.logoUrl ? (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                teamInitials(match.homeTeam.name, match.homeTeam.shortName)
              )}
            </div>

            <p className="mt-4 text-lg font-bold text-slate-950 sm:text-2xl">
              {match.homeTeam.name}
            </p>

            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
              Home
            </p>
          </div>

          {/* Score */}
          <div className="min-w-25 text-center sm:min-w-37.5">
            <div className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
              {showScore ? (
                <>
                  <span className={scoreClasses.home}>{match.homeScore}</span>

                  <span className="mx-2 text-slate-400">-</span>

                  <span className={scoreClasses.away}>{match.awayScore}</span>
                </>
              ) : (
                <span className="text-slate-400">VS</span>
              )}
            </div>

            {isLive && (
              <p className="mt-3 text-sm font-semibold text-red-600">LIVE</p>
            )}

            {match.status === "HALF_TIME" && (
              <p className="mt-3 text-sm font-semibold text-amber-600">
                HALF TIME
              </p>
            )}

            {isFinished && (
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                FULL TIME
              </p>
            )}

            {isLive && isRefreshing && (
              <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating…
              </p>
            )}
          </div>

          {/* Away */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 sm:h-24 sm:w-24 sm:text-2xl">
              {match.awayTeam.logoUrl ? (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                teamInitials(match.awayTeam.name, match.awayTeam.shortName)
              )}
            </div>

            <p className="mt-4 text-lg font-bold text-slate-950 sm:text-2xl">
              {match.awayTeam.name}
            </p>

            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
              Away
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* MATCH TIMELINE                                                       */}
      {/* ==================================================================== */}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-950">Match Events</h2>

            <p className="mt-1 text-sm text-slate-500">
              Goals, cards and other events
            </p>
          </div>

          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
              LIVE
            </span>
          )}
        </div>

        {/* No events */}
        {match.events.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              {isLive ? "No events recorded yet" : "No match events"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {isLive
                ? "Match events will appear here as they happen."
                : "No events have been recorded for this match."}
            </p>
          </div>
        ) : (
          <MatchTimeline
            events={match.events}
            homeTeamId={match.homeTeam.id}
            awayTeamId={match.awayTeam.id}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            isFinished={isFinished}
            isHalfTime={match.status === "HALF_TIME"}
          />
        )}
      </section>
    </>
  );
}
