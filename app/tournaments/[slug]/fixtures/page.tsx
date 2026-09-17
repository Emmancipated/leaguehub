import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function formatTime(date: Date | null) {
  if (!date) return "Time TBD";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Upcoming";
    case "LIVE":
      return "Live";
    case "HALF_TIME":
      return "Half Time";
    case "COMPLETED":
      return "Full Time";
    case "POSTPONED":
      return "Postponed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status.replaceAll("_", " ");
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "LIVE":
    case "HALF_TIME":
      return "bg-red-50 text-red-700 ring-red-200";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "POSTPONED":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "CANCELLED":
      return "bg-slate-100 text-slate-500 ring-slate-200";

    default:
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

function getScoreClasses(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) {
    return {
      home: "text-slate-950",
      away: "text-slate-950",
    };
  }

  return {
    home: homeScore > awayScore ? "text-emerald-600" : "text-rose-600",
    away: awayScore > homeScore ? "text-emerald-600" : "text-rose-600",
  };
}

export default async function PublicFixturesPage({ params }: Props) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      slug,
    },
    include: {
      settings: true,

      teams: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },

      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: [
          {
            roundNumber: "asc",
          },
          {
            scheduledAt: "asc",
          },
          {
            matchNumber: "asc",
          },
        ],
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  /*
   * Group matches by round.
   *
   * Using a Map keeps the rendering predictable and also
   * allows us to support any number of rounds.
   */
  const rounds = new Map<number | string, typeof tournament.matches>();

  for (const match of tournament.matches) {
    const round = match.roundNumber ?? "Unscheduled";

    const existing = rounds.get(round);

    if (existing) {
      existing.push(match);
    } else {
      rounds.set(round, [match]);
    }
  }

  const completedCount = tournament.matches.filter(
    (match) => match.status === "COMPLETED",
  ).length;

  const upcomingCount = tournament.matches.filter(
    (match) => match.status === "SCHEDULED" || match.status === "POSTPONED",
  ).length;

  const liveCount = tournament.matches.filter(
    (match) => match.status === "LIVE" || match.status === "HALF_TIME",
  ).length;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <CalendarDays className="h-4 w-4" />
              Fixtures
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Matches
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Follow every fixture, result and match scheduled for{" "}
              {tournament.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Trophy className="h-4 w-4" />
            <span>
              {tournament.matches.length}{" "}
              {tournament.matches.length === 1 ? "match" : "matches"}
            </span>
          </div>
        </div>
      </section>

      {/* Match statistics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upcoming
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {upcomingCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Scheduled or postponed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {completedCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">Finished matches</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {liveCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">Currently in progress</p>
        </div>
      </section>

      {/* Empty state */}
      {tournament.matches.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <CalendarDays className="h-7 w-7 text-slate-400" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No fixtures yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Fixtures will appear here once the tournament administrator
            creates or generates the competition schedule.
          </p>
        </section>
      )}

      {/* Fixtures grouped by round */}
      {Array.from(rounds.entries()).map(([round, matches]) => (
        <section
          key={String(round)}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Round header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Matchday
              </p>

              <h2 className="mt-1 text-base font-bold text-slate-950">
                {round === "Unscheduled"
                  ? "Unscheduled Matches"
                  : `Round ${round}`}
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              {matches.length} {matches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {/* Matches */}
          <div className="divide-y divide-slate-100">
            {matches.map((match) => {
              const isLive =
                match.status === "LIVE" || match.status === "HALF_TIME";

              const isCompleted = match.status === "COMPLETED";

              return (
                <Link
                  key={match.id}
                  href={`/tournaments/${tournament.slug}/matches/${match.id}`}
                  className="group block px-3 py-5 transition hover:bg-slate-50 sm:px-6"
                >
                  {/* Match meta */}
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Round {match.roundNumber ?? "—"}
                      {match.matchNumber ? ` • Match ${match.matchNumber}` : ""}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                        match.status,
                      )}`}
                    >
                      {isLive && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      )}

                      {getStatusLabel(match.status)}
                    </span>
                  </div>

                  {/* Teams / score */}
                  <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                    {/* Home */}
                    <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                      <span className="min-w-0 whitespace-normal break-words text-right text-[13px] font-semibold leading-5 text-slate-900 sm:text-base">
                        {match.homeTeam.name}
                      </span>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 sm:h-10 sm:w-10 sm:text-xs">
                        {match.homeTeam.logoUrl ? (
                          <img
                            src={match.homeTeam.logoUrl}
                            alt={match.homeTeam.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          match.homeTeam.shortName
                            ?.slice(0, 3)
                            .toUpperCase() ??
                            match.homeTeam.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="min-w-[60px] text-center sm:min-w-[72px]">
                      {isCompleted || isLive ? (
                        <div>
                          <div className="text-xl font-bold tracking-tight">
                            {(() => {
                              const scoreClasses = getScoreClasses(
                                match.homeScore,
                                match.awayScore,
                              );

                              return (
                                <>
                                  <span className={scoreClasses.home}>
                                    {match.homeScore}
                                  </span>
                                  <span className="mx-1 text-slate-400 sm:mx-2">
                                    -
                                  </span>
                                  <span className={scoreClasses.away}>
                                    {match.awayScore}
                                  </span>
                                </>
                              );
                            })()}
                          </div>

                          {isLive && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                              Live
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-slate-400">
                            VS
                          </div>

                          {match.status === "POSTPONED" && (
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                              Postponed
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 sm:h-10 sm:w-10 sm:text-xs">
                        {match.awayTeam.logoUrl ? (
                          <img
                            src={match.awayTeam.logoUrl}
                            alt={match.awayTeam.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          match.awayTeam.shortName
                            ?.slice(0, 3)
                            .toUpperCase() ??
                            match.awayTeam.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <span className="min-w-0 whitespace-normal break-words text-[13px] font-semibold leading-5 text-slate-900 sm:text-base">
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </div>

                  {/* Match details */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400 group-hover:text-slate-500">
                    {match.scheduledAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTime(match.scheduledAt)}
                      </span>
                    )}

                    {match.venue && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.venue}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 font-semibold text-slate-500 transition group-hover:text-slate-900">
                      Match details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
