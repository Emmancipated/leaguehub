"use client";

import { useState } from "react";
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
  teams: Team[];
  groups: Group[];
};

export default function CreateMatchForm({
  tournamentId,
  teams,
  groups,
}: Props) {
  const router = useRouter();

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [matchNumber, setMatchNumber] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!homeTeamId || !awayTeamId) {
      setError("Please select both teams.");
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError("Home and away teams must be different.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId,
          homeTeamId,
          awayTeamId,
          groupId: groupId || null,
          matchNumber: matchNumber ? Number(matchNumber) : null,
          roundNumber: roundNumber ? Number(roundNumber) : null,
          scheduledAt: scheduledAt || null,
          venue: venue || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create match.");
      }

      router.push(`/admin/tournaments/${tournamentId}/matches`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Home Team</label>

          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            required
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
          <label className="mb-2 block text-sm font-medium">Away Team</label>

          <select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            required
          >
            <option value="">Select team</option>

            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">Group</label>

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
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Match Number</label>

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
          <label className="mb-2 block text-sm font-medium">Round Number</label>

          <input
            type="number"
            min="1"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Date & Time</label>

        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Venue</label>

        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Main Stadium"
          className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/tournaments/${tournamentId}/matches`)
          }
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </div>
    </form>
  );
}
