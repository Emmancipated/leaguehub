import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "TBD";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMatchDate(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getMatchStatusLabel(status: string) {
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

export default async function PublicTournamentPage({ params }: Props) {
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

  const liveMatches = tournament.matches.filter(
    (match) => match.status === "LIVE" || match.status === "HALF_TIME",
  );

  const completedMatches = tournament.matches.filter(
    (match) => match.status === "COMPLETED",
  );

  const upcomingMatches = tournament.matches.filter(
    (match) => match.status === "SCHEDULED" || match.status === "POSTPONED",
  );

  const displayedMatches = tournament.matches.slice(0, 6);

  const format =
    tournament.settings?.competitionFormat === "LEAGUE"
      ? "League"
      : tournament.settings?.competitionFormat === "GROUP_AND_KNOCKOUT"
        ? "Group & Knockout"
        : tournament.settings?.competitionFormat === "KNOCKOUT"
          ? "Knockout"
          : "Competition";

  return (
    <div className="space-y-6">
      {/* Tournament summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Competition overview
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">Format</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {format}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">Teams</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {tournament.teams.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Users className="h-5 w-5 text-slate-700" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Registered
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight">
            {tournament.teams.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">Teams</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <CalendarDays className="h-5 w-5 text-slate-700" />
            </div>

            <span className="text-xs font-medium text-slate-400">Played</span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight">
            {completedMatches.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">Completed matches</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Trophy className="h-5 w-5 text-slate-700" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Remaining
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight">
            {upcomingMatches.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">Upcoming matches</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Shield className="h-5 w-5 text-slate-700" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Schedule
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight">
            {formatDate(tournament.startDate)}
          </p>

          <p className="mt-1 text-sm text-slate-500">Tournament start</p>
        </div>
      </section>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50/50 px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                <h2 className="font-semibold text-slate-950">Live matches</h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Matches currently in progress
              </p>
            </div>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              LIVE
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {liveMatches.map((match) => (
              <Link
                key={match.id}
                href={`/tournaments/${tournament.slug}/matches/${match.id}`}
                className="block px-5 py-5 transition hover:bg-slate-50 sm:px-6"
              >
                <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Round {match.roundNumber ?? "—"}</span>

                  <span className="font-semibold text-red-600">
                    {getMatchStatusLabel(match.status)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <p className="text-right text-sm font-semibold text-slate-900">
                    {match.homeTeam.name}
                  </p>

                  <div className="rounded-xl bg-slate-100 px-4 py-2 text-lg font-bold">
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
                          <span className="mx-1 text-slate-500">-</span>
                          <span className={scoreClasses.away}>
                            {match.awayScore}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {match.awayTeam.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Matches + teams */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Matches */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">Matches</h2>

              <p className="mt-1 text-sm text-slate-500">
                Recent results and upcoming fixtures
              </p>
            </div>

            <Link
              href={`/tournaments/${tournament.slug}/fixtures`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-slate-600"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {tournament.matches.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No matches yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fixtures will appear here once they are generated.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/tournaments/${tournament.slug}/matches/${match.id}`}
                  className="block px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Round {match.roundNumber ?? "—"}
                      {match.matchNumber
                        ? ` • Match ${match.matchNumber}`
                        : ""}
                    </span>

                    <span
                      className={
                        match.status === "LIVE" ||
                        match.status === "HALF_TIME"
                          ? "font-semibold text-red-600"
                          : "font-medium"
                      }
                    >
                      {getMatchStatusLabel(match.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <p className="text-right text-sm font-semibold text-slate-900">
                      {match.homeTeam.name}
                    </p>

                    <div className="min-w-[76px] text-center">
                      {match.status === "SCHEDULED" ||
                      match.status === "POSTPONED" ? (
                        <span className="text-sm font-semibold text-slate-400">
                          VS
                        </span>
                      ) : (
                        <span className="text-lg font-bold">
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
                                <span className="mx-1 text-slate-400">-</span>
                                <span className={scoreClasses.away}>
                                  {match.awayScore}
                                </span>
                              </>
                            );
                          })()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                      {match.awayTeam.name}
                    </p>
                  </div>

                  {match.scheduledAt && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      {formatMatchDate(match.scheduledAt)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Teams */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-semibold text-slate-950">Teams</h2>

              <p className="mt-1 text-sm text-slate-500">
                Participating teams
              </p>
            </div>

            <Link
              href={`/tournaments/${tournament.slug}/teams`}
              className="text-sm font-semibold text-slate-900 hover:text-slate-600"
            >
              View all
            </Link>
          </div>

          {tournament.teams.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-sm text-slate-500">
                No teams registered yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tournament.teams.slice(0, 6).map((team) => (
                <Link
                  key={team.id}
                  href={`/tournaments/${tournament.slug}/teams/${team.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      team.shortName?.slice(0, 3).toUpperCase() ??
                        team.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                    {team.name}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Tournament dates */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Tournament schedule
          </h2>

          <p className="mt-1 text-sm text-slate-500">Competition timeline</p>
        </div>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-slate-100 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Start date
            </p>

            <p className="mt-2 text-lg font-bold text-slate-950">
              {formatDate(tournament.startDate)}
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              End date
            </p>

            <p className="mt-2 text-lg font-bold text-slate-950">
              {formatDate(tournament.endDate)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
