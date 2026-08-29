// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// type Props = {
//   tournamentId: string;
//   matchId: string;
//   status: string;
// };

// export default function MatchActions({ tournamentId, matchId, status }: Props) {
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function updateStatus(newStatus: "LIVE" | "COMPLETED") {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `/api/tournaments/${tournamentId}/matches/${matchId}`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             status: newStatus,
//           }),
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to update match.");
//       }

//       router.refresh();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="border-t bg-gray-50 px-6 py-5">
//       {error && (
//         <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       <div className="flex flex-wrap gap-3">
//         {status === "SCHEDULED" && (
//           <button
//             type="button"
//             onClick={() => updateStatus("LIVE")}
//             disabled={loading}
//             className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? "Starting..." : "Start Match"}
//           </button>
//         )}

//         {status === "LIVE" && (
//           <button
//             type="button"
//             onClick={() => updateStatus("COMPLETED")}
//             disabled={loading}
//             className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? "Completing..." : "Complete Match"}
//           </button>
//         )}

//         {status === "COMPLETED" && (
//           <span className="rounded-lg bg-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-700">
//             Match Completed
//           </span>
//         )}

//         <button
//           type="button"
//           onClick={() =>
//             router.push(`/admin/tournaments/${tournamentId}/matches`)
//           }
//           disabled={loading}
//           className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//         >
//           Back
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tournamentId: string;
  matchId: string;
  status: string;
};

export default function MatchActions({ tournamentId, matchId, status }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update match.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t bg-gray-50 px-6 py-5">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "SCHEDULED" && (
          <button
            onClick={() => updateStatus("LIVE")}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Match"}
          </button>
        )}

        {status === "LIVE" && (
          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Completing..." : "Complete Match"}
          </button>
        )}

        {status === "COMPLETED" && (
          <span className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium">
            Match Completed
          </span>
        )}

        <button
          onClick={() =>
            router.push(`/admin/tournaments/${tournamentId}/matches`)
          }
          className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
}
