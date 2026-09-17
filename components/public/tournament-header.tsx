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
    <header className="relative overflow-hidden bg-[#102a43] text-white">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[#1f4e68] opacity-40 [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[220px] flex-col justify-between gap-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white/80 transition hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6b4a6] text-[#102a43]">
                <Trophy className="h-4 w-4" />
              </span>
              LeagueHub
            </Link>

            <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-white/45 sm:block">
              Official tournament hub
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {tournament.name}
              </h1>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
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
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                {tournament.description}
              </p>
            )}

            {(startDate || endDate) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
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
        </div>
      </div>
    </header>
  );
}
