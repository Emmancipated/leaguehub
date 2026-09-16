import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamNameEditor from "./_components/team-name-editor";

type Props = {
  params: Promise<{
    tournamentId: string;
    teamId: string;
  }>;
};

export default async function TeamPage({ params }: Props) {
  const { tournamentId, teamId } = await params;

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
    },
    include: {
      group: true,
      tournament: {
        include: {
          settings: true,
        },
      },
      players: {
        where: {
          isActive: true,
        },
        include: {
          player: true,
        },
        orderBy: {
          player: {
            lastName: "asc",
          },
        },
      },
      managers: true,
      _count: {
        select: {
          players: true,
          managers: true,
          homeMatches: true,
          awayMatches: true,
        },
      },
    },
  });

  if (!team) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Team not found</h1>
      </div>
    );
  }

  const maximumPlayers =
    team.tournament.settings?.maximumPlayersPerTeam ?? null;

  return (
      <div className="mx-auto max-w-6xl">

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold shadow-sm">
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {team.name}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {team.shortName || "No short name"}
                  {team.group ? ` • ${team.group.name}` : ""}
                </p>

                <TeamNameEditor initialName={team.name} />
              </div>
            </div>
          </div>

          <Link
            href={`/admin/tournaments/${tournamentId}/teams/${teamId}/players`}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Manage Players
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Players</p>
            <p className="mt-1 text-3xl font-bold">
              {team._count.players}
            </p>

            {maximumPlayers !== null && (
              <p className="mt-1 text-xs text-gray-500">
                Maximum {maximumPlayers}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Managers</p>
            <p className="mt-1 text-3xl font-bold">
              {team._count.managers}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Home Matches</p>
            <p className="mt-1 text-3xl font-bold">
              {team._count.homeMatches}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Away Matches</p>
            <p className="mt-1 text-3xl font-bold">
              {team._count.awayMatches}
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Current Players</h2>

            <p className="mt-1 text-sm text-gray-500">
              Players currently registered to {team.name}.
            </p>
          </div>

          {team.players.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold">No players assigned</h3>

              <p className="mt-2 text-sm text-gray-500">
                Add players to this team before the tournament begins.
              </p>

              <Link
                href={`/admin/tournaments/${tournamentId}/teams/${teamId}/players`}
                className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Manage Players
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {team.players.map((registration) => {
                const player = registration.player;

                return (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between p-5"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {player.displayName ||
                          `${player.firstName} ${player.lastName}`}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {player.displayName &&
                          `${player.firstName} ${player.lastName}`}
                        {player.jerseyNumber !== null &&
                          ` • #${player.jerseyNumber}`}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
