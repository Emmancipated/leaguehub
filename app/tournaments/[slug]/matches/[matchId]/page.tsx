import { notFound } from "next/navigation";
import { CalendarDays, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMatchDate, formatMatchTime } from "@/lib/match-utils";
import LiveMatch from "./_components/live-match";
import LiveMatchRefresh from "@/components/public/live-match-refresh";

type Props = {
  params: Promise<{
    slug: string;
    matchId: string;
  }>;
};

type PublicPlayer = {
  id: string;
  firstName: string;
  lastName: string;
};

type PublicMatchOnlyPlayer = {
  name: string;
};

export default async function PublicMatchPage({ params }: Props) {
  const { slug, matchId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      tournamentId: tournament.id,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      events: {
        select: {
          id: true,
          type: true,
          minute: true,
          addedTime: true,
          description: true,
          createdAt: true,
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assistedByPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assistedByMatchPlayer: {
            select: {
              name: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
            },
          },
        },
        orderBy: [
          {
            minute: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!match) {
    notFound();
  }

  const isLive = match.status === "LIVE";

  return (
    <>
      <LiveMatchRefresh enabled={isLive} interval={3000} />

      {/* Match meta */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-center text-sm text-slate-500">
          {match.roundNumber !== null && <span>Round {match.roundNumber}</span>}

          {match.matchNumber !== null && <span>Match {match.matchNumber}</span>}

          {match.group && <span>{match.group.name}</span>}
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm text-slate-500 sm:flex-row sm:gap-4">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {formatMatchDate(match.scheduledAt)}
          </span>

          {formatMatchTime(match.scheduledAt) && (
            <>
              <span className="hidden text-slate-300 sm:block">•</span>

              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-400" />
                {formatMatchTime(match.scheduledAt)}
              </span>
            </>
          )}
        </div>
      </section>

      {/* Scoreboard + events */}
      <div className="mt-8">
        <LiveMatch
          tournamentId={tournament.id}
          matchId={match.id}
          initialMatch={{
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            homeTeam: {
              id: match.homeTeam.id,
              name: match.homeTeam.name,
              shortName: match.homeTeam.shortName,
              logoUrl: match.homeTeam.logoUrl,
            },
            awayTeam: {
              id: match.awayTeam.id,
              name: match.awayTeam.name,
              shortName: match.awayTeam.shortName,
              logoUrl: match.awayTeam.logoUrl,
            },
            events: match.events.map((event) => {
              const assistedByPlayer =
                event.assistedByPlayer as PublicPlayer | null;
              const assistedByMatchPlayer =
                event.assistedByMatchPlayer as PublicMatchOnlyPlayer | null;

              return {
                id: event.id,
                type: event.type,
                minute: event.minute,
                addedTime: event.addedTime,
                description: event.description,
                player: event.player
                  ? {
                      id: event.player.id,
                      firstName: event.player.firstName,
                      lastName: event.player.lastName,
                    }
                  : null,
                assistedByPlayer,
                assistedByMatchPlayer,
                team: event.team,
              };
            }),
          }}
        />
      </div>
    </>
  );
}
