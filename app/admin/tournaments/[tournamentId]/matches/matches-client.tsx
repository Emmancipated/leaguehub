"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
};

type Group = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  matchNumber: number | null;
  roundNumber: number | null;
  scheduledAt: string | null;
  venue: string | null;
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: Team;
  awayTeam: Team;
  group: Group | null;
};

type Props = {
  tournamentId: string;
};

export default function MatchesClient({ tournamentId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMatches() {
    try {
      setLoading(true);

      const response = await fetch(`/api/tournaments/${tournamentId}/matches`);

      if (!response.ok) {
        throw new Error("Failed to load matches");
      }

      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchMatches() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/tournaments/${tournamentId}/matches`,
        );

        if (!response.ok) {
          throw new Error("Failed to load matches");
        }

        const data = await response.json();

        if (!cancelled) {
          setMatches(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMatches();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  function formatDate(date: string | null) {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusLabel(status: string) {
    return status.replace("_", " ");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Fixtures & Matches
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Schedule matches and manage tournament results.
          </p>
        </div>

        <Link
          href={`/admin/tournaments/${tournamentId}/matches/new`}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          + Create Match
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading fixtures...
          </div>
        ) : matches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
              ⚽
            </div>

            <h2 className="font-medium text-gray-900">No matches yet</h2>

            <p className="mt-1 text-sm text-gray-500">
              Create the first fixture for this tournament.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentId}/matches/new`}
              className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Create Match
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/admin/tournaments/${tournamentId}/matches/${match.id}`}
                className="block p-5 transition hover:bg-gray-50"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {match.matchNumber && (
                      <span>Match {match.matchNumber}</span>
                    )}

                    {match.group && (
                      <>
                        <span>•</span>
                        <span>{match.group.name}</span>
                      </>
                    )}

                    {match.roundNumber && (
                      <>
                        <span>•</span>
                        <span>Round {match.roundNumber}</span>
                      </>
                    )}
                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {statusLabel(match.status)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {match.homeTeam.name}
                    </p>
                    {match.homeTeam.shortName && (
                      <p className="text-xs text-gray-400">
                        {match.homeTeam.shortName}
                      </p>
                    )}
                  </div>

                  <div className="min-w-[70px] text-center">
                    {match.status === "COMPLETED" ||
                    match.status === "LIVE" ||
                    match.status === "HALF_TIME" ? (
                      <div className="text-xl font-semibold text-gray-900">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-400">
                        VS
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {match.awayTeam.name}
                    </p>
                    {match.awayTeam.shortName && (
                      <p className="text-xs text-gray-400">
                        {match.awayTeam.shortName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>📅 {formatDate(match.scheduledAt)}</span>

                  {match.venue && <span>📍 {match.venue}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
