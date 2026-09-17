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
    <div className="min-h-screen bg-[#f4f7f8] text-[#102a43]">
      <TournamentHeader tournament={tournament} />

      <TournamentNav slug={tournament.slug} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
