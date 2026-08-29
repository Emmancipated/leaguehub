import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MatchActions from "./match-actions";
import EventForm from "./event-form";
import EventActions from "./event-actions";
import EditMatchForm from "./edit-match-form";

type Props = {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
};

export default async function MatchPage({ params }: Props) {
  const { tournamentId, matchId } = await params;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      tournamentId,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      events: {
        include: {
          player: true,
        },
        orderBy: {
          minute: "asc",
        },
      },
    },
  });

  if (!match) {
    notFound();
  }

  const players = await prisma.player.findMany({
    where: {
      tournamentId,
      registrationStatus: "ACTIVE",
      teamRegistrations: {
        some: {
          teamId: {
            in: [match.homeTeamId, match.awayTeamId],
          },
          isActive: true,
        },
      },
    },
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });
  return (
    <div>
      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="border-b bg-gray-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Match {match.matchNumber ?? "—"}
                {match.group ? ` • ${match.group.name}` : ""}
              </p>

              <h1 className="mt-1 text-xl font-bold">
                {match.homeTeam.name} vs {match.awayTeam.name}
              </h1>
            </div>

            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium">
              {match.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="px-6 py-10">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-8 text-center">
            <div className="flex-1">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold">
                {match.homeTeam.shortName?.slice(0, 3) ??
                  match.homeTeam.name.slice(0, 2).toUpperCase()}
              </div>

              <h2 className="font-semibold">{match.homeTeam.name}</h2>
            </div>

            <div>
              <div className="text-4xl font-bold">
                {match.homeScore}
                <span className="mx-2 text-gray-300">:</span>
                {match.awayScore}
              </div>

              <p className="mt-2 text-xs text-gray-500">FULL SCORE</p>
            </div>

            <div className="flex-1">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold">
                {match.awayTeam.shortName?.slice(0, 3) ??
                  match.awayTeam.name.slice(0, 2).toUpperCase()}
              </div>

              <h2 className="font-semibold">{match.awayTeam.name}</h2>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 border-t pt-6 text-sm md:grid-cols-3">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="mt-1 font-medium">
                {match.scheduledAt
                  ? new Date(match.scheduledAt).toLocaleString()
                  : "Not scheduled"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Venue</p>
              <p className="mt-1 font-medium">
                {match.venue ?? "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Referee</p>
              <p className="mt-1 font-medium">
                {match.refereeName ?? "Not assigned"}
              </p>
            </div>
          </div>

          <EditMatchForm
            tournamentId={tournamentId}
            match={{
              id: match.id,
              scheduledAt: match.scheduledAt,
              venue: match.venue,
              refereeName: match.refereeName,
            }}
          />
        </div>

        <MatchActions
          tournamentId={tournamentId}
          matchId={match.id}
          status={match.status}
        />
      </div>
      <div className="mt-8 rounded-2xl border bg-white">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold">Match Events</h2>
          <p className="mt-1 text-sm text-gray-500">
            Goals, cards, substitutions and other match events will appear here.
          </p>
        </div>

        {match.events.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No events recorded yet.
          </div>
        ) : (
          <div className="divide-y">
            {match.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-medium">{event.type.replace("_", " ")}</p>

                  {event.player && (
                    <p className="text-sm text-gray-500">
                      {event.player.firstName} {event.player.lastName}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm font-semibold">
                    {event.minute !== null ? `${event.minute}'` : "—"}
                  </span>

                  <EventActions matchId={match.id} eventId={event.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <EventForm
        matchId={match.id}
        players={players}
        disabled={match.status !== "LIVE" && match.status !== "HALF_TIME"}
      />{" "}
    </div>
  );
}
