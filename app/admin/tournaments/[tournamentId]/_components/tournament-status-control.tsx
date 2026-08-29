"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const transitions: Record<string, { value: string; label: string }[]> = {
  DRAFT: [
    { value: "REGISTRATION", label: "Open Registration" },
    { value: "CANCELLED", label: "Cancel Tournament" },
  ],
  REGISTRATION: [
    { value: "SCHEDULED", label: "Schedule Tournament" },
    { value: "DRAFT", label: "Return to Draft" },
    { value: "CANCELLED", label: "Cancel Tournament" },
  ],
  SCHEDULED: [
    { value: "LIVE", label: "Start Tournament" },
    { value: "REGISTRATION", label: "Reopen Registration" },
    { value: "CANCELLED", label: "Cancel Tournament" },
  ],
  LIVE: [
    { value: "COMPLETED", label: "Complete Tournament" },
    { value: "CANCELLED", label: "Cancel Tournament" },
  ],
  COMPLETED: [],
  CANCELLED: [
    { value: "DRAFT", label: "Restore to Draft" },
  ],
};

export default function TournamentStatusControl({
  tournamentId,
  currentStatus,
}: {
  tournamentId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const options = transitions[currentStatus] ?? [];

  if (options.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Tournament status is <strong>{currentStatus}</strong>.
      </div>
    );
  }

  async function changeStatus(status: string) {
    const confirmation = window.confirm(
      `Are you sure you want to change the tournament status to ${status}?`,
    );

    if (!confirmation) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update tournament status.",
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update tournament status.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold text-gray-900">
          Tournament Status
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Current status:{" "}
          <span className="font-medium text-gray-900">
            {currentStatus}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => changeStatus(option.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
