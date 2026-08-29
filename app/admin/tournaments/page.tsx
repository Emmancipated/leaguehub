import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      settings: true,
      _count: {
        select: {
          teams: true,
          players: true,
          matches: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tournaments
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your LeagueHub tournaments.
            </p>
          </div>

          <Link
            href="/admin/tournaments/new"
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Create Tournament
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No tournaments yet
            </h2>

            <p className="mt-2 text-gray-500">
              Create your first tournament to get started.
            </p>

            <Link
              href="/admin/tournaments/new"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create Tournament
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="divide-y divide-gray-100">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/admin/tournaments/${tournament.id}`}
                  className="block p-6 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {tournament.name}
                        </h2>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {tournament.status}
                        </span>
                      </div>

                      {tournament.description && (
                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                          {tournament.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {tournament._count.teams}
                        </p>
                        <p className="text-xs text-gray-500">Teams</p>
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {tournament._count.players}
                        </p>
                        <p className="text-xs text-gray-500">Players</p>
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {tournament._count.matches}
                        </p>
                        <p className="text-xs text-gray-500">Matches</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
