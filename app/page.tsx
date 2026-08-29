import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Shield,
  Trophy,
  Users,
  BarChart2,
  Activity,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION"
  | "SCHEDULED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

const PUBLIC_STATUSES: TournamentStatus[] = [
  "REGISTRATION",
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
];

function getStatusLabel(status: TournamentStatus) {
  switch (status) {
    case "REGISTRATION":
      return "Registration Open";
    case "SCHEDULED":
      return "Scheduled";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusClasses(status: TournamentStatus) {
  switch (status) {
    case "LIVE":
      return "bg-red-50 text-red-700 ring-red-200";
    case "REGISTRATION":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

const formatLabel = (format: string | null | undefined) =>
  format === "LEAGUE"
    ? "League"
    : format === "KNOCKOUT"
      ? "Knockout"
      : format === "GROUP_AND_KNOCKOUT"
        ? "Groups & Knockout"
        : "Competition";

const features = [
  {
    title: "Tournament Management",
    description:
      "Every competition gets a dedicated hub with fixtures, standings and results.",
    icon: Trophy,
  },
  {
    title: "Live Match Center",
    description:
      "Follow matches in real time with live scores, goals and cards as they happen.",
    icon: Activity,
  },
  {
    title: "Standings & Stats",
    description:
      "Automatic league tables sorted by points, goal difference and tie-breakers.",
    icon: BarChart2,
  },
  {
    title: "Teams & Players",
    description:
      "Browse every participating team, squad and player statistics in one place.",
    icon: Users,
  },
];

async function getPublicTournaments() {
  try {
    return await prisma.tournament.findMany({
      where: {
        status: { in: PUBLIC_STATUSES },
      },
      orderBy: [
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
      take: 9,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        settings: {
          select: {
            competitionFormat: true,
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const tournaments = await getPublicTournaments();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold text-slate-950"
            >
              <Trophy className="h-6 w-6 text-indigo-600" />
              LeagueHub
            </Link>

            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="#tournaments"
                className="text-slate-600 transition hover:text-slate-950"
              >
                Browse
              </Link>

              <Link
                href="#features"
                className="text-slate-600 transition hover:text-slate-950"
              >
                Features
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Organizer Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Community tournaments, centralised in one place.
              </h1>

              <p className="mt-5 text-lg text-slate-600">
                Browse public competitions, follow live scores, check the
                latest results and stay updated with the league table.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="#tournaments"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Browse Tournaments
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-slate-200 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Everything a fan needs
              </h2>

              <p className="mt-4 text-lg text-slate-600">
                Fixtures, live scores, standings and team pages for every
                competition.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold text-slate-950">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tournaments */}
        <section
          id="tournaments"
          className="border-t border-slate-200 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Browse Tournaments
                </h2>

                <p className="mt-3 text-lg text-slate-600">
                  {tournaments.length === 0
                    ? "No tournaments are currently open."
                    : `${tournaments.length} tournament${tournaments.length === 1 ? " is" : "s are"} open.`}
                </p>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
                <Trophy className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No tournaments open yet
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Check back later to follow live tournaments and results.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => {
                  const isLive = tournament.status === "LIVE";

                  return (
                    <Link
                      key={tournament.id}
                      href={`/tournaments/${tournament.slug}`}
                      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold tracking-tight text-slate-950">
                            {tournament.name}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {tournament.description ||
                              "Follow this tournament for fixtures and results."}
                          </p>
                        </div>

                        {isLive && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                            LIVE
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ring-1 ${getStatusClasses(
                            tournament.status as TournamentStatus,
                          )}`}
                        >
                          {getStatusLabel(
                            tournament.status as TournamentStatus,
                          )}
                        </span>

                        <span className="flex items-center gap-1 text-slate-500">
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono">
                            {formatLabel(
                              tournament.settings?.competitionFormat,
                            )}
                          </span>
                        </span>

                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          {tournament._count.teams} teams
                        </span>

                        <span className="flex items-center gap-1.5 text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {tournament._count.matches} matches
                        </span>
                      </div>

                      <div className="mt-4 flex items-center text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        View tournament
                        <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <Shield className="h-5 w-5 text-indigo-600" />
              LeagueHub
            </div>

            <p className="text-sm text-slate-500">
              Are you a tournament organizer?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-900 underline decoration-indigo-600 underline-offset-2 hover:text-indigo-600"
              >
                Sign in to your account
              </Link>
              .
            </p>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            &copy; {new Date().getFullYear()} LeagueHub. Tournament management
            for community football.
          </p>
        </div>
      </footer>
    </div>
  );
}
