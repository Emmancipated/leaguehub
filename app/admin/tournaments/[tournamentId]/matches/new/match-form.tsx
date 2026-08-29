"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: string;
  name: string;
};

type Group = {
  id: string;
  name: string;
};

type Props = {
  tournamentId: string;
};

export default function MatchForm({ tournamentId }: Props) {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [matchNumber, setMatchNumber] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsResponse, groupsResponse] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}/teams`),
          fetch(`/api/tournaments/${tournamentId}/groups`),
        ]);

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(
            Array.isArray(teamsData) ? teamsData : (teamsData.teams ?? []),
          );
        }

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups(
            Array.isArray(groupsData) ? groupsData : (groupsData.groups ?? []),
          );
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load tournament data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tournamentId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!homeTeamId || !awayTeamId) {
      setError("Please select both teams.");
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError("A team cannot play against itself.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId,
          awayTeamId,
          groupId: groupId || null,
          matchNumber: matchNumber || null,
          roundNumber: roundNumber || null,
          scheduledAt: scheduledAt || null,
          venue: venue || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create match");
      }

      router.push(`/admin/tournaments/${tournamentId}/matches`);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        Loading tournament data...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create Match</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a fixture to the tournament schedule.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Home Team
            </label>

            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            >
              <option value="">Select team</option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Away Team
            </label>

            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            >
              <option value="">Select team</option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Group
            </label>

            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            >
              <option value="">No group</option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Match Number
            </label>

            <input
              type="number"
              min="1"
              value={matchNumber}
              onChange={(e) => setMatchNumber(e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Round Number
            </label>

            <input
              type="number"
              min="1"
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Scheduled Date & Time
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Venue
            </label>

            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Main Stadium"
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/tournaments/${tournamentId}/matches`)
          }
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || teams.length < 2}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Match"}
        </button>
      </div>
    </form>
  );
}
