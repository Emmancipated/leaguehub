import Link from "next/link";
import { Trophy, CalendarDays } from "lucide-react";

type TournamentHeaderProps = {
  tournament: {
    name: string;
    slug: string;
    description?: string | null;
    status: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  };
};

function formatDate(date?: Date | string | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
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

function getStatusClasses(status: string) {
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

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const startDate = formatDate(tournament.startDate);
  const endDate = formatDate(tournament.endDate);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[180px] flex-col justify-between gap-6 py-7 sm:flex-row sm:items-end sm:py-8">
          <div className="min-w-0">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <Trophy className="h-4 w-4" />
              LeagueHub
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {tournament.name}
              </h1>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                  tournament.status,
                )}`}
              >
                {tournament.status === "LIVE" && (
                  <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                )}

                {getStatusLabel(tournament.status)}
              </span>
            </div>

            {tournament.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {tournament.description}
              </p>
            )}

            {(startDate || endDate) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />

                <span>
                  {startDate && endDate
                    ? `${startDate} — ${endDate}`
                    : startDate
                      ? startDate
                      : endDate}
                </span>
              </div>
            )}
          </div>

          {/* <div className="hidden shrink-0 sm:block">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tournament
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                Official Competition
              </p>
            </div>
          </div> */}
        </div>
      </div>
    </header>
  );
}
