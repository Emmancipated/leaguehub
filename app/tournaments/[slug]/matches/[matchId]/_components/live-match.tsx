"use client";

import { useEffect, useState } from "react";
import {
  matchStatusClasses,
  matchStatusLabel,
  teamInitials,
  eventIcon,
  eventLabel,
} from "@/lib/match-utils";

type Team = {
  id: string;
  name: string;
  shortName?: string | null;
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

export default function LiveMatch({
  tournamentId,
  matchId,
  initialMatch,
}: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "COMPLETED";

  const showScore =
    !(match.status === "SCHEDULED" || match.status === "POSTPONED");

  return (
    <>
      {/* Scoreboard */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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

        <div className="mt-6 sm:mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-10">
          {/* Home */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 sm:h-24 sm:w-24 sm:text-2xl">
              {teamInitials(match.homeTeam.name, match.homeTeam.shortName)}
            </div>

            <p className="mt-4 text-lg font-bold text-slate-950 sm:text-2xl">
              {match.homeTeam.name}
            </p>

            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
              Home
            </p>
          </div>

          {/* Score */}
          <div className="min-w-[100px] text-center sm:min-w-[150px]">
            <div className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
              {showScore ? (
                <>
                  {match.homeScore}
                  <span className="mx-2 text-slate-400">-</span>
                  {match.awayScore}
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
              <p className="mt-2 text-xs text-slate-400">Updating…</p>
            )}
          </div>

          {/* Away */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 sm:h-24 sm:w-24 sm:text-2xl">
              {teamInitials(match.awayTeam.name, match.awayTeam.shortName)}
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

      {/* Events */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between">
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
        </div>

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
          <div className="divide-y divide-slate-100">
            {match.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
                  {eventIcon(event.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {eventLabel(event.type)}
                  </p>

                  {event.player && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {event.player.firstName} {event.player.lastName}
                    </p>
                  )}

                  {event.description && (
                    <p className="mt-1 text-xs text-slate-400">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {event.minute !== null ? (
                    <span className="text-sm font-bold text-slate-700">
                      {event.minute}
                      {event.addedTime ? `+${event.addedTime}` : ""}
                      &apos;
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
