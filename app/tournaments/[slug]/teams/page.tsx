import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicTeamsPage({ params }: Props) {
  const { slug } = await params;

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

  const teams = await prisma.team.findMany({
    where: {
      tournamentId: tournament.id,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      _count: {
        select: {
          players: true,
        },
      },
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <Trophy className="h-4 w-4" />
          Teams
        </div>

        <span className="text-sm text-slate-500">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Participating Teams
        </h1>

        <p className="mt-2 text-slate-600">
          All teams registered for this tournament.
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No teams registered
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Teams will appear here once they are added to the tournament.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const initials = team.shortName
              ? team.shortName.slice(0, 3).toUpperCase()
              : team.name.slice(0, 2).toUpperCase();

            return (
              <Link
                key={team.id}
                href={`/tournaments/${tournament.slug}/teams/${team.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff0ed] text-xl font-bold text-[#c85d4e]">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-slate-900 group-hover:text-[#c85d4e]">
                    {team.name}
                  </h2>

                  {team.shortName && (
                    <p className="text-sm text-slate-500">{team.shortName}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  {team._count.players}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
