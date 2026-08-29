import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStandings } from "@/server/tournaments/standings.service";
import LiveStandingsRefresh from "@/components/public/live-standings-refresh";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function positionClasses(position: number) {
  return position <= 3
    ? "bg-indigo-500/15 text-indigo-600"
    : "text-slate-400";
}

function goalDifferenceLabel(goalDifference: number) {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}

export default async function PublicStandingsPage({ params }: Props) {
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

  let standings: Awaited<ReturnType<typeof getStandings>>;

  try {
    standings = await getStandings(tournament.id);
  } catch {
    standings = [];
  }

  return (
    <>
      <LiveStandingsRefresh interval={5000} />

      <section className="space-y-6">
        {/* Heading */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <Trophy className="h-4 w-4" />
          Standings
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            League Table
          </h2>

          <Link
            href={`/tournaments/${tournament.slug}/fixtures`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-indigo-600"
          >
            View fixtures
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {standings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Trophy className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No teams yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Standings will appear once teams are added to the tournament.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden w-full min-w-[720px] text-left text-sm sm:table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5 text-center">Pos</th>
                    <th className="px-4 py-3.5">Team</th>
                    <th className="px-4 py-3.5 text-center">P</th>
                    <th className="px-4 py-3.5 text-center">W</th>
                    <th className="px-4 py-3.5 text-center">D</th>
                    <th className="px-4 py-3.5 text-center">L</th>
                    <th className="px-4 py-3.5 text-center">GF</th>
                    <th className="px-4 py-3.5 text-center">GA</th>
                    <th className="px-4 py-3.5 text-center">GD</th>
                    <th className="px-4 py-3.5 text-center font-bold text-indigo-600">
                      Pts
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {standings.map((team) => (
                    <tr
                      key={team.teamId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${positionClasses(
                            team.position,
                          )}`}
                        >
                          {team.position}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-950">
                        {team.teamName}
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {team.played}
                      </td>

                      <td className="px-4 py-3.5 text-center font-semibold text-emerald-600">
                        {team.won}
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {team.drawn}
                      </td>

                      <td className="px-4 py-3.5 text-center font-semibold text-rose-500">
                        {team.lost}
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {team.goalsFor}
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {team.goalsAgainst}
                      </td>

                      <td className="px-4 py-3.5 text-center font-medium">
                        {team.goalDifference > 0 ? (
                          <span className="text-emerald-600">
                            +{team.goalDifference}
                          </span>
                        ) : team.goalDifference < 0 ? (
                          <span className="text-rose-500">
                            {team.goalDifference}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {team.goalDifference}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-950">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 sm:hidden">
                {standings.map((team) => (
                  <li key={team.teamId} className="px-4 py-3.5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${positionClasses(
                            team.position,
                          )}`}
                        >
                          {team.position}
                        </span>

                        <span className="min-w-0 font-semibold text-slate-950">
                          {team.teamName}
                        </span>
                      </div>

                      <span className="font-bold text-indigo-600">
                        Pts {team.points}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>P {team.played}</span>

                      <span className="text-emerald-600">
                        W {team.won}
                      </span>

                      <span>D {team.drawn}</span>

                      <span className="text-rose-500">
                        L {team.lost}
                      </span>

                      <span>GF {team.goalsFor}</span>

                      <span>GA {team.goalsAgainst}</span>

                      <span
                        className={
                          team.goalDifference > 0
                            ? "text-emerald-600"
                            : team.goalDifference < 0
                              ? "text-rose-500"
                              : "text-slate-400"
                        }
                      >
                        GD {goalDifferenceLabel(team.goalDifference)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>
            <strong className="text-slate-400">P</strong> Played
          </span>

          <span>
            <strong className="text-slate-400">W</strong> Won
          </span>

          <span>
            <strong className="text-slate-400">D</strong> Drawn
          </span>

          <span>
            <strong className="text-slate-400">L</strong> Lost
          </span>

          <span>
            <strong className="text-slate-400">GF</strong> Goals For
          </span>

          <span>
            <strong className="text-slate-400">GA</strong> Goals Against
          </span>

          <span>
            <strong className="text-slate-400">GD</strong> Goal Difference
          </span>

          <span>
            <strong className="text-slate-400">Pts</strong> Points
          </span>
        </div>
      </section>
    </>
  );
}
