"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tournamentId: string;
  teams: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  match: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    groupId: string | null;
    matchNumber: number | null;
    roundNumber: number | null;
    scheduledAt: Date | string | null;
    venue: string | null;
    status: string;
    homeScore: number;
    awayScore: number;
    refereeName: string | null;
  };
};

function toDateTimeLocal(value: Date | string | null | undefined): string {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditMatchForm({
  tournamentId,
  teams,
  groups,
  match,
}: Props) {
  const router = useRouter();

  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId);
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId);
  const [groupId, setGroupId] = useState(match.groupId ?? "");
  const [matchNumber, setMatchNumber] = useState(
    match.matchNumber?.toString() ?? "",
  );
  const [roundNumber, setRoundNumber] = useState(
    match.roundNumber?.toString() ?? "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocal(match.scheduledAt),
  );
  const [venue, setVenue] = useState(match.venue ?? "");
  const [status, setStatus] = useState(match.status);
  const [homeScore, setHomeScore] = useState(match.homeScore.toString());
  const [awayScore, setAwayScore] = useState(match.awayScore.toString());
  const [refereeName, setRefereeName] = useState(match.refereeName ?? "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      setError("Select two different home and away teams.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: "PATCH",
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
            venue: venue.trim() || null,
            status,
            homeScore,
            awayScore,
            refereeName: refereeName.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update match.");
      }

      setSuccess("Fixture details updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this match? Its result will be removed from the league table.",
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete match.");
      }

      router.push(`/admin/tournaments/${tournamentId}/matches`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Edit Match</h3>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Home Team
          </label>
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
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
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
            {[
              "SCHEDULED",
              "LIVE",
              "HALF_TIME",
              "COMPLETED",
              "POSTPONED",
              "CANCELLED",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
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
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
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
            Home Score
          </label>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Away Score
          </label>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
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
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
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
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Scheduled Date &amp; Time
          </label>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
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
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Referee
          </label>

          <input
            type="text"
            value={refereeName}
            onChange={(e) => setRefereeName(e.target.value)}
            placeholder="e.g. Jane Smith"
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="mr-auto rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Match"}
        </button>
        <button
          type="submit"
          disabled={saving || deleting}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
