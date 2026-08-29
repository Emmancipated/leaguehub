"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Standing = {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export default function StandingsPage() {
  const params = useParams();

  const tournamentId = params.tournamentId as string;

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStandings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/standings`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load standings.");
      }

      setStandings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load standings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchStandings() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/tournaments/${tournamentId}/standings`,
        );

        if (!response.ok) {
          throw new Error("Failed to load standings.");
        }

        const data = await response.json();

        if (!cancelled) {
          setStandings(data);
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

    fetchStandings();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">League Table</h1>

              <p className="mt-2 text-gray-600">
                Current standings based on completed matches.
              </p>
            </div>

            <button
              onClick={loadStandings}
              disabled={loading}
              className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-sm text-gray-500">Loading league table...</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <h2 className="text-lg font-semibold">No teams yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Add teams to this tournament to see the league table.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentId}/teams`}
              className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Manage Teams
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-4 text-center">Pos</th>

                    <th className="px-4 py-4">Team</th>

                    <th className="px-4 py-4 text-center">P</th>

                    <th className="px-4 py-4 text-center">W</th>

                    <th className="px-4 py-4 text-center">D</th>

                    <th className="px-4 py-4 text-center">L</th>

                    <th className="px-4 py-4 text-center">GF</th>

                    <th className="px-4 py-4 text-center">GA</th>

                    <th className="px-4 py-4 text-center">GD</th>

                    <th className="px-4 py-4 text-center">Pts</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {standings.map((team) => (
                    <tr key={team.teamId} className="hover:bg-gray-50">
                      <td className="px-4 py-5 text-center">
                        <span className="font-semibold">{team.position}</span>
                      </td>

                      <td className="px-4 py-5">
                        <Link
                          href={`/admin/tournaments/${tournamentId}/teams/${team.teamId}`}
                          className="font-semibold hover:underline"
                        >
                          {team.teamName}
                        </Link>
                      </td>

                      <td className="px-4 py-5 text-center">{team.played}</td>

                      <td className="px-4 py-5 text-center">{team.won}</td>

                      <td className="px-4 py-5 text-center">{team.drawn}</td>

                      <td className="px-4 py-5 text-center">{team.lost}</td>

                      <td className="px-4 py-5 text-center">{team.goalsFor}</td>

                      <td className="px-4 py-5 text-center">
                        {team.goalsAgainst}
                      </td>

                      <td className="px-4 py-5 text-center font-medium">
                        {team.goalDifference > 0
                          ? `+${team.goalDifference}`
                          : team.goalDifference}
                      </td>

                      <td className="px-4 py-5 text-center">
                        <span className="text-lg font-bold">{team.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">
                P = Played · W = Won · D = Drawn · L = Lost · GF = Goals For ·
                GA = Goals Against · GD = Goal Difference · Pts = Points
              </p>
            </div>
          </div>
        )}
      </div>
  );
}
