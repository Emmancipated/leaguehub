// "use client";

// import { FormEvent, useEffect, useState } from "react";
// import { useParams } from "next/navigation";

// type Team = {
//   id: string;
//   name: string;
//   shortName: string | null;
//   logoUrl: string | null;
//   isActive: boolean;
//   players: unknown[];
// };

// export default function TeamsPage() {
//   const params = useParams();

//   const tournamentId = params.tournamentId as string;

//   const [teams, setTeams] = useState<Team[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [name, setName] = useState("");
//   const [shortName, setShortName] = useState("");

//   async function loadTeams() {
//     try {
//       setLoading(true);

//       const response = await fetch(
//         `/api/admin/tournaments/${tournamentId}/teams`,
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to load teams");
//       }

//       setTeams(data);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadTeams();
//   }, [tournamentId]);

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!name.trim()) return;

//     try {
//       setSaving(true);

//       const response = await fetch(
//         `/api/admin/tournaments/${tournamentId}/teams`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name,
//             shortName,
//           }),
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(data.error || "Failed to create team");
//         return;
//       }

//       setTeams((current) => [...current, { ...data, players: [] }]);
//       setName("");
//       setShortName("");
//     } catch (error) {
//       console.error(error);
//       alert("Something went wrong");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function handleDelete(teamId: string) {
//     const confirmed = window.confirm(
//       "Are you sure you want to delete this team?",
//     );

//     if (!confirmed) return;

//     try {
//       const response = await fetch(
//         `/api/admin/tournaments/${tournamentId}/teams/${teamId}`,
//         {
//           method: "DELETE",
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(data.error || "Failed to delete team");
//         return;
//       }

//       setTeams((current) => current.filter((team) => team.id !== teamId));
//     } catch (error) {
//       console.error(error);
//       alert("Something went wrong");
//     }
//   }

//   return (
//     <main className="min-h-screen bg-gray-50 p-6">
//       <div className="mx-auto max-w-6xl">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Teams</h1>

//           <p className="mt-2 text-gray-600">
//             Register and manage teams for this tournament.
//           </p>
//         </div>

//         <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
//           {/* Add team */}
//           <section className="rounded-xl border bg-white p-6 shadow-sm">
//             <h2 className="mb-5 text-xl font-semibold">Add Team</h2>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Team name
//                 </label>

//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(event) => setName(event.target.value)}
//                   placeholder="e.g. Achievers FC"
//                   className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium">
//                   Short name
//                 </label>

//                 <input
//                   type="text"
//                   value={shortName}
//                   onChange={(event) => setShortName(event.target.value)}
//                   placeholder="e.g. AFC"
//                   maxLength={10}
//                   className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={saving}
//                 className="w-full rounded-lg bg-black px-4 py-2.5 font-medium text-white disabled:opacity-50"
//               >
//                 {saving ? "Adding..." : "Add Team"}
//               </button>
//             </form>
//           </section>

//           {/* Teams */}
//           <section className="rounded-xl border bg-white p-6 shadow-sm">
//             <div className="mb-5 flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Registered Teams</h2>

//               <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
//                 {teams.length} teams
//               </span>
//             </div>

//             {loading ? (
//               <p className="py-10 text-center text-gray-500">
//                 Loading teams...
//               </p>
//             ) : teams.length === 0 ? (
//               <div className="rounded-lg border border-dashed p-10 text-center">
//                 <p className="font-medium text-gray-700">
//                   No teams registered yet.
//                 </p>

//                 <p className="mt-1 text-sm text-gray-500">
//                   Add the first team using the form.
//                 </p>
//               </div>
//             ) : (
//               <div className="divide-y">
//                 {teams.map((team) => (
//                   <div
//                     key={team.id}
//                     className="flex items-center justify-between gap-4 py-4"
//                   >
//                     <div className="flex items-center gap-4">
//                       <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 font-bold">
//                         {team.shortName || team.name.slice(0, 2).toUpperCase()}
//                       </div>

//                       <div>
//                         <h3 className="font-semibold text-gray-900">
//                           {team.name}
//                         </h3>

//                         <p className="text-sm text-gray-500">
//                           {team.players.length} players
//                         </p>
//                       </div>
//                     </div>

//                     <button
//                       onClick={() => handleDelete(team.id)}
//                       className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 ))}
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
import { BulkTeamsImporter } from "@/components/bulk-csv-importer";

type Props = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export default async function TeamsPage({ params }: Props) {
  const { tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      settings: true,
      teams: {
        include: {
          group: true,
          _count: {
            select: {
              players: true,
              managers: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
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

  const teamLimit = tournament.settings?.numberOfTeams ?? null;

  return (
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-bold">
              {tournament.name} — Teams
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the teams participating in this tournament.
            </p>
          </div>

          <Link
            href={`/admin/tournaments/${tournamentId}/teams/new`}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Team
          </Link>
        </div>

        <BulkTeamsImporter tournamentId={tournamentId} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Teams</p>
            <p className="mt-1 text-3xl font-bold">{tournament.teams.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Team limit</p>
            <p className="mt-1 text-3xl font-bold">{teamLimit ?? "—"}</p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Available slots</p>
            <p className="mt-1 text-3xl font-bold">
              {teamLimit === null
                ? "—"
                : Math.max(teamLimit - tournament.teams.length, 0)}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          {tournament.teams.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-lg font-semibold">No teams yet</h2>

              <p className="mt-2 text-sm text-gray-500">
                Add the first team to this tournament.
              </p>

              <Link
                href={`/admin/tournaments/${tournamentId}/teams/new`}
                className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Add Team
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {tournament.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-bold">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        team.shortName ||
                        team.name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/teams/${team.id}`}
                        className="font-semibold hover:underline"
                      >
                        {team.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {team.shortName || "No short name"}
                        {team.group ? ` • ${team.group.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>{team._count.players} players</p>
                    <p>{team._count.managers} managers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
