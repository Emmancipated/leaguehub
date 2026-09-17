import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeam } from "@/server/tournaments/team.service";

type Props = {
  params: Promise<{
    slug: string;
    teamId: string;
  }>;
};

function playerStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "SUSPENDED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REMOVED":
      return "bg-slate-100 text-slate-600 ring-slate-300";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function playerStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "SUSPENDED":
      return "Suspended";
    case "REMOVED":
      return "Removed";
    case "PENDING":
      return "Pending";
    default:
      return status.replaceAll("_", " ");
  }
}

export default async function PublicTeamPage({ params }: Props) {
  const { slug, teamId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  const team = await getTeam(tournament.id, teamId);

  if (!team) {
    notFound();
  }

  const players = team.players ?? [];
  const managers = team.managers ?? [];
  const groupLabel = team.group?.code ?? team.group?.name;

  return (
    <section className="space-y-6">
      {/* Section label */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <Trophy className="h-4 w-4" />
        Teams
      </div>

      {/* Team header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0ed] text-3xl font-bold text-[#c85d4e]">
            {team.shortName
              ? team.shortName.slice(0, 3).toUpperCase()
              : team.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {team.name}
              </h1>

              {team.shortName && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {team.shortName}
                </span>
              )}
            </div>

            {groupLabel && (
              <p className="mt-1.5 text-sm text-slate-500">
                Group: {groupLabel}
              </p>
            )}
          </div>
        </div>

        <Link
          href={`/tournaments/${tournament.slug}/teams`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-[#c85d4e]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to teams
        </Link>
      </div>

      {/* Squad */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">Squad</h2>

          <span className="text-sm text-slate-500">
            {players.length} player{players.length === 1 ? "" : "s"}
          </span>
        </div>

        {players.length === 0 ? (
          <div className="mt-6 text-sm text-slate-500">
            No players registered to this team yet.
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((registration) => {
              const player = registration.player;

              const displayName = player?.displayName
                ? player.displayName
                : `${player?.firstName} ${player?.lastName}`;

              return (
                <li
                  key={registration.id}
                  className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    {player?.jerseyNumber ?? "—"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950">
                      {displayName}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${playerStatusClasses(
                      player?.registrationStatus ?? "PENDING",
                    )}`}
                  >
                    {playerStatusLabel(player?.registrationStatus ?? "PENDING")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Staff */}
      {managers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Staff</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {managers.map((manager) => (
              <span
                key={manager.id}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3.5 py-1.5 text-sm text-slate-700"
              >
                <UserRound className="h-4 w-4 text-slate-400" />
                {manager.user?.name ?? "Staff"}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
