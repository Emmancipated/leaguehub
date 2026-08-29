"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Match = {
  id: string;
  matchNumber: number | null;
  roundNumber: number | null;
  scheduledAt: string | null;
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
};

export default function FixturesPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadFixtures() {
    setLoading(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load fixtures.");
      }

      setMatches(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load fixtures.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateFixtures() {
    if (!confirm("Generate fixtures for this tournament?")) {
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/fixtures/generate`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate fixtures.");
      }

      await loadFixtures();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate fixtures.",
      );
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchFixtures() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/tournaments/${tournamentId}/fixtures`,
        );

        if (!response.ok) {
          throw new Error("Failed to load fixtures.");
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

    fetchFixtures();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const rounds = Array.from(
    new Set(matches.map((match) => match.roundNumber)),
  ).sort((a, b) => (a ?? 0) - (b ?? 0));

  return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fixtures</h1>

            <p className="mt-2 text-gray-600">Manage tournament matches.</p>
          </div>

          {matches.length === 0 && (
            <button
              onClick={generateFixtures}
              disabled={generating}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Fixtures"}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading fixtures...</p>
        ) : matches.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold">No fixtures yet</h2>

            <p className="mt-2 text-gray-500">
              Register your teams and generate the fixtures.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {rounds.map((round) => {
              const roundMatches = matches.filter(
                (match) => match.roundNumber === round,
              );

              return (
                <section key={round} className="rounded-xl bg-white shadow-sm">
                  <div className="border-b px-6 py-4">
                    <h2 className="font-semibold">Matchday {round}</h2>
                  </div>

                  <div className="divide-y">
                    {roundMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between px-6 py-5"
                      >
                        <div className="flex-1 text-right font-medium">
                          {match.homeTeam.name}
                        </div>

                        <div className="mx-8 text-center">
                          <div className="text-xs text-gray-400">
                            #{match.matchNumber}
                          </div>

                          <div className="mt-1 font-bold">
                            {match.status === "COMPLETED"
                              ? `${match.homeScore} - ${match.awayScore}`
                              : "vs"}
                          </div>
                        </div>

                        <div className="flex-1 font-medium">
                          {match.awayTeam.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
  );
}
