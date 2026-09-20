"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  teamId: string;
  teamName: string;
};

type MatchPlayer = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
};

type Team = {
  id: string;
  name: string;
};

type Props = {
  matchId: string;
  players: Player[];
  matchPlayers: MatchPlayer[];
  teams: Team[];
  disabled: boolean;
};

const EVENT_TYPES = [
  { value: "GOAL", label: "Goal" },
  { value: "OWN_GOAL", label: "Own Goal" },
  { value: "YELLOW_CARD", label: "Yellow Card" },
  { value: "SECOND_YELLOW", label: "Second Yellow" },
  { value: "RED_CARD", label: "Red Card" },
  { value: "SUBSTITUTION", label: "Substitution" },
  { value: "PENALTY_MISSED", label: "Penalty Missed" },
];

export default function EventForm({
  matchId,
  players,
  matchPlayers,
  teams,
  disabled,
}: Props) {
  const router = useRouter();

  const [type, setType] = useState("GOAL");
  const [playerId, setPlayerId] = useState("");
  const [assistedBy, setAssistedBy] = useState("");
  const [minute, setMinute] = useState("");
  const [addedTime, setAddedTime] = useState("");
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestTeamId, setGuestTeamId] = useState(teams[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/matches/${matchId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          playerId: playerId.startsWith("player:")
            ? playerId.split(":")[1]
            : null,
          teamId: playerId.includes(":") ? playerId.split(":")[2] : null,
          matchPlayerId: playerId.startsWith("match:")
            ? playerId.split(":")[1]
            : null,
          assistedByPlayerId: assistedBy.startsWith("player:")
            ? assistedBy.split(":")[1]
            : null,
          assistedByMatchPlayerId: assistedBy.startsWith("match:")
            ? assistedBy.split(":")[1]
            : null,
          minute: minute ? Number(minute) : null,
          addedTime: addedTime ? Number(addedTime) : null,
          description: description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record event.");
      }

      setPlayerId("");
      setAssistedBy("");
      setMinute("");
      setAddedTime("");
      setDescription("");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function addGuestPlayer() {
    if (!guestName.trim() || !guestTeamId) {
      setError("Enter the ad hoc player's name and team.");
      return;
    }

    setAddingGuest(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/matches/${matchId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName, teamId: guestTeamId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add ad hoc player.");
      }

      setGuestName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAddingGuest(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-gray-50 p-6">
      <h3 className="font-semibold">Record Event</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Event</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={disabled || loading}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
            {EVENT_TYPES.map((event) => (
              <option key={event.value} value={event.value}>
                {event.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Player</label>

          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            disabled={disabled || loading}
            required
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
            {players.map((player) => (
              <option
                key={`${player.id}-${player.teamId}`}
                value={`player:${player.id}:${player.teamId}`}
              >
                {player.firstName} {player.lastName} ({player.teamName})
              </option>
            ))}

            {matchPlayers.map((player) => (
              <option key={player.id} value={`match:${player.id}`}>
                {player.name} ({player.teamName}, match-only)
              </option>
            ))}
          </select>
        </div>

        {type === "GOAL" && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Assisted by{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>

            <select
              value={assistedBy}
              onChange={(e) => setAssistedBy(e.target.value)}
              disabled={disabled || loading}
              className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            >
              <option value="">No assist</option>

              {players.map((player) => (
                <option
                  key={`assist-${player.id}-${player.teamId}`}
                  value={`player:${player.id}:${player.teamId}`}
                >
                  {player.firstName} {player.lastName} ({player.teamName})
                </option>
              ))}

              {matchPlayers.map((player) => (
                <option
                  key={`assist-${player.id}`}
                  value={`match:${player.id}`}
                >
                  {player.name} ({player.teamName}, match-only)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Minute</label>

          <input
            type="number"
            min="0"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            placeholder="e.g. 12"
            disabled={disabled || loading}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Added Time</label>

          <input
            type="number"
            min="0"
            value={addedTime}
            onChange={(e) => setAddedTime(e.target.value)}
            placeholder="e.g. 2"
            disabled={disabled || loading}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Description</label>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          disabled={disabled || loading}
          className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 border-t pt-5">
        <p className="text-sm font-semibold text-gray-900">
          Add match-only player
        </p>
        <p className="mt-1 text-xs text-gray-500">
          This player is available only for this match and will not change any
          permanent team registration.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Player name"
            disabled={disabled || loading || addingGuest}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />

          <select
            value={guestTeamId}
            onChange={(e) => setGuestTeamId(e.target.value)}
            disabled={disabled || loading || addingGuest}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={addGuestPlayer}
            disabled={disabled || loading || addingGuest}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingGuest ? "Adding..." : "Add Player"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || loading}
        className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Recording..." : "Record Event"}
      </button>
    </form>
  );
}
