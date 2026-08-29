"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  jerseyNumber: number | null;
  dateOfBirth: string | null;
  registrationStatus: string;
};

type TeamPlayer = {
  id: string;
  playerId: string;
  isActive: boolean;
  player: Player;
};

type Team = {
  id: string;
  name: string;
  shortName: string | null;
};

export default function TeamPlayersPage() {
  const params = useParams<{
    tournamentId: string;
    teamId: string;
  }>();

  const tournamentId = params.tournamentId;
  const teamId = params.teamId;

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  const [maximumPlayers, setMaximumPlayers] = useState<number | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        teamResponse,
        playersResponse,
        tournamentPlayersResponse,
        settingsResponse,
      ] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`),
        fetch(`/api/tournaments/${tournamentId}/teams/${teamId}/players`),
        fetch(`/api/tournaments/${tournamentId}/players`),
        fetch(`/api/tournaments/${tournamentId}/settings`),
      ]);

      const teamData = await teamResponse.json();
      const playersData = await playersResponse.json();
      const tournamentPlayersData = await tournamentPlayersResponse.json();
      const settingsData = await settingsResponse.json();

      if (!teamResponse.ok) {
        throw new Error(teamData.error || "Failed to load team.");
      }

      if (!playersResponse.ok) {
        throw new Error(playersData.error || "Failed to load team players.");
      }

      if (!tournamentPlayersResponse.ok) {
        throw new Error(
          tournamentPlayersData.error || "Failed to load tournament players.",
        );
      }

      if (!settingsResponse.ok) {
        throw new Error(
          settingsData.error || "Failed to load tournament settings.",
        );
      }

      setTeam(teamData);
      setPlayers(playersData);
      setMaximumPlayers(settingsData.maximumPlayersPerTeam ?? null);

      const assignedPlayerIds = new Set(
        playersData.map((registration: TeamPlayer) => registration.playerId),
      );

      setAvailablePlayers(
        tournamentPlayersData.filter(
          (player: Player) =>
            !assignedPlayerIds.has(player.id) &&
            player.registrationStatus !== "REMOVED",
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load squad.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [
          teamResponse,
          playersResponse,
          tournamentPlayersResponse,
          settingsResponse,
        ] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`),
          fetch(`/api/tournaments/${tournamentId}/teams/${teamId}/players`),
          fetch(`/api/tournaments/${tournamentId}/players`),
          fetch(`/api/tournaments/${tournamentId}/settings`),
        ]);

        const teamData = await teamResponse.json();
        const playersData = await playersResponse.json();
        const tournamentPlayersData = await tournamentPlayersResponse.json();
        const settingsData = await settingsResponse.json();

        if (!teamResponse.ok) {
          throw new Error(teamData.error || "Failed to load team.");
        }

        if (!playersResponse.ok) {
          throw new Error(playersData.error || "Failed to load team players.");
        }

        if (!tournamentPlayersResponse.ok) {
          throw new Error(
            tournamentPlayersData.error || "Failed to load tournament players.",
          );
        }

        if (!settingsResponse.ok) {
          throw new Error(
            settingsData.error || "Failed to load tournament settings.",
          );
        }

        if (!cancelled) {
          setTeam(teamData);
          setPlayers(playersData);
          setMaximumPlayers(settingsData.maximumPlayersPerTeam ?? null);

          const assignedPlayerIds = new Set(
            playersData.map(
              (registration: TeamPlayer) => registration.playerId,
            ),
          );

          setAvailablePlayers(
            tournamentPlayersData.filter(
              (player: Player) =>
                !assignedPlayerIds.has(player.id) &&
                player.registrationStatus !== "REMOVED",
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load squad.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, teamId]);

  async function assignPlayer() {
    if (!selectedPlayerId) {
      setError("Select a player first.");
      return;
    }

    setAssigning(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: selectedPlayerId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign player.");
      }

      setSelectedPlayerId("");
      setMessage("Player added to the team.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign player.");
    } finally {
      setAssigning(false);
    }
  }

  async function removePlayer(playerId: string) {
    const confirmed = window.confirm("Remove this player from the team?");

    if (!confirmed) {
      return;
    }

    setRemovingPlayerId(playerId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}/players`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove player.");
      }

      setMessage("Player removed from the team.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove player.");
    } finally {
      setRemovingPlayerId(null);
    }
  }

  const squadFull = maximumPlayers !== null && players.length >= maximumPlayers;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-gray-500">Loading squad...</p>
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-6xl">

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {team?.name ?? "Team"} — Squad
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the players registered to this team.
            </p>
          </div>

          <div className="rounded-xl border bg-white px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Squad
            </p>

            <p className="mt-1 text-2xl font-bold">
              {players.length}
              {maximumPlayers !== null ? ` / ${maximumPlayers}` : ""}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Add Player</h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a player already registered for this tournament.
          </p>

          {squadFull ? (
            <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              This team has reached its maximum squad size.
            </div>
          ) : availablePlayers.length === 0 ? (
            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              There are no available tournament players to add.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedPlayerId}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                className="flex-1 rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              >
                <option value="">Select player...</option>

                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.displayName ||
                      `${player.firstName} ${player.lastName}`}
                    {player.jerseyNumber !== null
                      ? ` — #${player.jerseyNumber}`
                      : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={assignPlayer}
                disabled={assigning || !selectedPlayerId}
                className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigning ? "Adding..." : "Add Player"}
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">Current Squad</h2>

            <p className="mt-1 text-sm text-gray-500">
              Players currently registered to {team?.name}.
            </p>
          </div>

          {players.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold">No players in this squad</h3>

              <p className="mt-2 text-sm text-gray-500">
                Use the selector above to add the first player.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {players.map((registration) => {
                const player = registration.player;

                return (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                        {player.jerseyNumber ??
                          player.firstName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {player.displayName ||
                            `${player.firstName} ${player.lastName}`}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {player.firstName} {player.lastName}
                          {player.jerseyNumber !== null
                            ? ` • #${player.jerseyNumber}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      disabled={removingPlayerId === player.id}
                      className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingPlayerId === player.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
