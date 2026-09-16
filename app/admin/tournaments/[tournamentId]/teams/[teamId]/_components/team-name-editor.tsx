"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Props = {
  initialName: string;
};

export default function TeamNameEditor({ initialName }: Props) {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const teamId = params.teamId as string;

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update team");
      }

      setName(data.name);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex max-w-xl flex-wrap items-end gap-2">
      <div className="min-w-64 flex-1">
        <label htmlFor="team-name" className="mb-1 block text-xs font-medium text-gray-500">
          Team name
        </label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save name"}
      </button>
      {error && (
        <p className="basis-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}