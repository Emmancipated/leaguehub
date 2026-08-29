"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Team = {
  id: string;
  name: string;
  shortName: string | null;
};

export default function NewPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tournamentId = params.tournamentId as string;
  const initialTeamId = searchParams.get("teamId") || "";

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState(initialTeamId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch(
          `/api/tournaments/${tournamentId}/teams`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load teams.");
        }

        setTeams(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load teams.",
        );
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, [tournamentId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId || null,
            firstName,
            lastName,
            displayName,
            jerseyNumber: jerseyNumber
              ? Number(jerseyNumber)
              : null,
            dateOfBirth: dateOfBirth || null,
            phoneNumber: phoneNumber || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to register player.",
        );
      }

      if (teamId) {
        router.push(
          `/admin/tournaments/${tournamentId}/teams/${teamId}`,
        );
      } else {
        router.push(
          `/admin/tournaments/${tournamentId}/players`,
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="mx-auto max-w-2xl">

        <div className="mt-6 rounded-xl border bg-white p-6">
          <h1 className="text-2xl font-bold">
            Register Player
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Register a player for this tournament.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Team
              </label>

              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={loadingTeams}
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              >
                <option value="">
                  {loadingTeams
                    ? "Loading teams..."
                    : "Select a team"}
                </option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.shortName
                      ? ` (${team.shortName})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="First name"
                value={firstName}
                onChange={setFirstName}
                required
              />

              <Field
                label="Last name"
                value={lastName}
                onChange={setLastName}
                required
              />
            </div>

            <Field
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Optional"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Jersey number"
                value={jerseyNumber}
                onChange={setJerseyNumber}
                type="number"
                placeholder="Optional"
              />

              <Field
                label="Date of birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                type="date"
              />
            </div>

            <Field
              label="Phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="Optional"
            />

            <button
              type="submit"
              disabled={loading || loadingTeams}
              className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Registering..."
                : "Register Player"}
            </button>
          </form>
        </div>
      </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
      />
    </div>
  );
}
