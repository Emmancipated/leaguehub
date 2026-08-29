import type { ReactNode } from "react";
import { TournamentHeader } from "./tournament-header";
import { TournamentNav } from "./tournament-nav";

type TournamentShellProps = {
  tournament: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    status: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  };
  children: ReactNode;
};

export function TournamentShell({
  tournament,
  children,
}: TournamentShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <TournamentHeader tournament={tournament} />

      <TournamentNav slug={tournament.slug} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
