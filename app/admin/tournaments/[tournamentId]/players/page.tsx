// "use client";

// import { FormEvent, useEffect, useState } from "react";
// import { useParams } from "next/navigation";

// type Team = {
//   id: string;
//   name: string;
//   shortName: string | null;
// };

// type Player = {
//   id: string;
//   firstName: string;
//   lastName: string;
//   displayName: string | null;
//   jerseyNumber: number | null;
//   registrationStatus: string;
//   teamRegistrations: {
//     team: Team;
//   }[];
// };

// export default function PlayersPage() {
//   const params = useParams();

//   const tournamentId = params.tournamentId as string;

//   const [players, setPlayers] = useState<Player[]>([]);
//   const [teams, setTeams] = useState<Team[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [displayName, setDisplayName] = useState("");
//   const [jerseyNumber, setJerseyNumber] = useState("");
//   const [teamId, setTeamId] = useState("");

//   async function loadData() {
//     try {
//       setLoading(true);

//       const [playersResponse, teamsResponse] = await Promise.all([
//         fetch(`/api/admin/tournaments/${tournamentId}/players`),
//         fetch(`/api/admin/tournaments/${tournamentId}/teams`),
//       ]);

//       const playersData = await playersResponse.json();
//       const teamsData = await teamsResponse.json();

//       if (!playersResponse.ok) {
//         throw new Error(playersData.error || "Failed to load players");
//       }

//       if (!teamsResponse.ok) {
//         throw new Error(teamsData.error || "Failed to load teams");
//       }

//       setPlayers(playersData);
//       setTeams(teamsData);

//       if (!teamId && teamsData.length > 0) {
//         setTeamId(teamsData[0].id);
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadData();
//   }, [tournamentId]);

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!firstName || !lastName || !teamId) {
//       return;
//     }

//     try {
//       setSaving(true);

//       const response = await fetch(
//         `/api/admin/tournaments/${tournamentId}/players`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             firstName,
//             lastName,
//             displayName,
//             jerseyNumber,
//             teamId,
//           }),
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(data.error || "Failed to register player");
//         return;
//       }

//       setFirstName("");
//       setLastName("");
//       setDisplayName("");
//       setJerseyNumber("");

//       await loadData();
//     } catch (error) {
//       console.error(error);
//       alert("Something went wrong");
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <main className="min-h-screen bg-gray-50 p-6">
//       <div className="mx-auto max-w-7xl">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Players</h1>

//           <p className="mt-2 text-gray-600">
//             Register players and assign them to their teams.
//           </p>
//         </div>

//         <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
//           {/* Registration form */}
//           <section className="rounded-xl border bg-white p-6 shadow-sm">
//             <h2 className="mb-5 text-xl font-semibold">Register Player</h2>

//             {teams.length === 0 ? (
//               <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
//                 Create at least one team before registering players.
//               </div>
//             ) : (
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="mb-1 block text-sm font-medium">
//                     First name
//                   </label>

//                   <input
//                     value={firstName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     className="w-full rounded-lg border px-3 py-2"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-sm font-medium">
//                     Last name
//                   </label>

//                   <input
//                     value={lastName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     className="w-full rounded-lg border px-3 py-2"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-sm font-medium">
//                     Display name
//                   </label>

//                   <input
//                     value={displayName}
//                     onChange={(e) => setDisplayName(e.target.value)}
//                     placeholder="Optional"
//                     className="w-full rounded-lg border px-3 py-2"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-sm font-medium">
//                     Jersey number
//                   </label>

//                   <input
//                     type="number"
//                     min="1"
//                     value={jerseyNumber}
//                     onChange={(e) => setJerseyNumber(e.target.value)}
//                     className="w-full rounded-lg border px-3 py-2"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-sm font-medium">Team</label>

//                   <select
//                     value={teamId}
//                     onChange={(e) => setTeamId(e.target.value)}
//                     className="w-full rounded-lg border px-3 py-2"
//                     required
//                   >
//                     <option value="">Select team</option>

//                     {teams.map((team) => (
//                       <option key={team.id} value={team.id}>
//                         {team.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="w-full rounded-lg bg-black px-4 py-2.5 font-medium text-white disabled:opacity-50"
//                 >
//                   {saving ? "Registering..." : "Register Player"}
//                 </button>
//               </form>
//             )}
//           </section>

//           {/* Players list */}
//           <section className="rounded-xl border bg-white p-6 shadow-sm">
//             <div className="mb-5 flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Registered Players</h2>

//               <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
//                 {players.length} players
//               </span>
//             </div>

//             {loading ? (
//               <p className="py-10 text-center text-gray-500">
//                 Loading players...
//               </p>
//             ) : players.length === 0 ? (
//               <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
//                 No players registered yet.
//               </div>
//             ) : (
//               <div className="divide-y">
//                 {players.map((player) => {
//                   const team = player.teamRegistrations[0]?.team;

//                   return (
//                     <div
//                       key={player.id}
//                       className="flex items-center justify-between py-4"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold">
//                           {player.jerseyNumber ?? "-"}
//                         </div>

//                         <div>
//                           <p className="font-semibold">
//                             {player.displayName ||
//                               `${player.firstName} ${player.lastName}`}
//                           </p>

//                           <p className="text-sm text-gray-500">
//                             {team?.name || "No team assigned"}
//                           </p>
//                         </div>
//                       </div>

//                       <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
//                         {player.registrationStatus}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BulkPlayersImporter } from "@/components/bulk-csv-importer";

type Props = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export default async function PlayersPage({ params }: Props) {
  const { tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        orderBy: { name: "asc" },
      },
      players: {
        include: {
          teamRegistrations: {
            where: { isActive: true },
            include: {
              team: true,
            },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  if (!tournament) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Tournament not found</h1>
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-7xl">
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="mt-1 text-sm text-gray-500">{tournament.name}</p>
          </div>

          <Link
            href={`/admin/tournaments/${tournamentId}/players/new`}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Register Player
          </Link>
        </div>

        <BulkPlayersImporter tournamentId={tournamentId} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Players" value={tournament.players.length} />

          <StatCard
            label="Active"
            value={
              tournament.players.filter(
                (player) => player.registrationStatus === "ACTIVE",
              ).length
            }
          />

          <StatCard
            label="Pending"
            value={
              tournament.players.filter(
                (player) => player.registrationStatus === "PENDING",
              ).length
            }
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          {tournament.players.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="font-semibold">No players registered</h2>

              <p className="mt-2 text-sm text-gray-500">
                Register the first player for this tournament.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 font-medium">Player</th>
                    <th className="px-5 py-4 font-medium">Team</th>
                    <th className="px-5 py-4 font-medium">Jersey</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {tournament.players.map((player) => {
                    const team = player.teamRegistrations[0]?.team;

                    return (
                      <tr key={player.id}>
                        <td className="px-5 py-4">
                          <div className="font-medium">
                            {player.displayName ||
                              `${player.firstName} ${player.lastName}`}
                          </div>

                          {player.displayName && (
                            <div className="text-xs text-gray-500">
                              {player.firstName} {player.lastName}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {team?.name || "Unassigned"}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {player.jerseyNumber ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={player.registrationStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
      {status}
    </span>
  );
}
