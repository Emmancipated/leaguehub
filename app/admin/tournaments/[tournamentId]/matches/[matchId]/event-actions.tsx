"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matchId: string;
  eventId: string;
};

export default function EventActions({ matchId, eventId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteEvent() {
    const confirmed = window.confirm(
      "Delete this event? If it is a goal, the match score will also be corrected.",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/matches/${matchId}/events/${eventId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete event.");
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={deleteEvent}
        disabled={loading}
        className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
