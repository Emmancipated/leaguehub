import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandings } from "@/server/tournaments/standings.service";
import TournamentStatusControl from "./_components/tournament-status-control";

type Props = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export default async function TournamentDashboardPage({ params }: Props) {
  const { tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      settings: true,

      teams: {
        where: {
          isActive: true,
        },
      },

      players: {
        where: {
          registrationStatus: "ACTIVE",
        },
      },

      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: [
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

  const standings = tournament.settings ? await getStandings(tournamentId) : [];

  const completedMatches = tournament.matches.filter(
    (match) => match.status === "COMPLETED",
  );

  const liveMatches = tournament.matches.filter(
    (match) => match.status === "LIVE",
  );

  const scheduledMatches = tournament.matches.filter(
    (match) => match.status === "SCHEDULED",
  );

  const postponedMatches = tournament.matches.filter(
    (match) => match.status === "POSTPONED",
  );

  const cancelledMatches = tournament.matches.filter(
    (match) => match.status === "CANCELLED",
  );

  const totalFixtures = tournament.matches.length;

  const completionPercentage =
    totalFixtures > 0
      ? Math.round((completedMatches.length / totalFixtures) * 100)
      : 0;

  const leader = standings[0] ?? null;

  const recentResults = [...completedMatches]
    .sort((a, b) => {
      const aTime = a.updatedAt?.getTime() ?? 0;
      const bTime = b.updatedAt?.getTime() ?? 0;

      return bTime - aTime;
    })
    .slice(0, 5);

  const upcomingFixtures = [...scheduledMatches]
    .sort((a, b) => {
      const aTime = a.scheduledAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduledAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    })
    .slice(0, 5);

  const cards = [
    {
      title: "Teams",
      value: tournament.teams.length,
      description: "Registered teams",
      href: `/admin/tournaments/${tournament.id}/teams`,
    },
    {
      title: "Players",
      value: tournament.players.length,
      description: "Active players",
      href: `/admin/tournaments/${tournament.id}/players`,
    },
    {
      title: "Fixtures",
      value: tournament.matches.length,
      description: "Total fixtures",
      href: `/admin/tournaments/${tournament.id}/fixtures`,
    },
    {
      title: "Standings",
      value: "View",
      description: "League table",
      href: `/admin/tournaments/${tournament.id}/standings`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-end">
        <Link
          href={`/admin/tournaments/${tournament.id}/settings`}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Tournament Settings
        </Link>
      </div>

      {/* Tournament status */}
      <div className="mb-8">
        <TournamentStatusControl
          tournamentId={tournament.id}
          currentStatus={tournament.status}
        />
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{card.title}</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {card.value}
            </p>

            <p className="mt-1 text-sm text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Competition progress */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Competition Progress
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Progress based on completed fixtures.
            </p>
          </div>

          <p className="text-2xl font-bold text-gray-900">
            {completionPercentage}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{
              width: `${completionPercentage}%`,
            }}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Scheduled" value={scheduledMatches.length} />

          <Stat label="Live" value={liveMatches.length} />

          <Stat label="Completed" value={completedMatches.length} />

          <Stat label="Postponed" value={postponedMatches.length} />

          <Stat label="Cancelled" value={cancelledMatches.length} />
        </div>
      </section>

      {/* League snapshot + upcoming */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* League leader */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                League Table
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current tournament leader.
              </p>
            </div>

            <Link
              href={`/admin/tournaments/${tournament.id}/standings`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              Full table →
            </Link>
          </div>

          {leader ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Current leader
              </p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {leader.teamName}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {leader.played} played · {leader.won}W · {leader.drawn}D ·{" "}
                    {leader.lost}L
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {leader.points}
                  </p>

                  <p className="text-xs uppercase text-gray-400">points</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">
                Add teams to see the league table.
              </p>
            </div>
          )}
        </section>

        {/* Upcoming fixtures */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Fixtures
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Next scheduled matches.
              </p>
            </div>

            <Link
              href={`/admin/tournaments/${tournament.id}/fixtures`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              All fixtures →
            </Link>
          </div>

          {upcomingFixtures.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">No upcoming fixtures.</p>
            </div>
          ) : (
            <div className="mt-6 divide-y">
              {upcomingFixtures.map((match) => (
                <Link
                  key={match.id}
                  href={`/admin/tournaments/${tournament.id}/matches/${match.id}`}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {match.homeTeam.name}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {match.awayTeam.name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-400">
                      Match {match.matchNumber ?? "—"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {match.scheduledAt
                        ? new Date(match.scheduledAt).toLocaleDateString()
                        : "Not scheduled"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent results */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Results
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest completed matches.
            </p>
          </div>

          <Link
            href={`/admin/tournaments/${tournament.id}/matches`}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            Manage matches →
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No completed matches yet.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y">
            {recentResults.map((match) => (
              <Link
                key={match.id}
                href={`/admin/tournaments/${tournament.id}/matches/${match.id}`}
                className="flex items-center justify-between gap-6 py-4 hover:bg-gray-50"
              >
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">
                    {match.homeTeam.name}
                  </p>
                </div>

                <div className="min-w-22.5 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {match.homeScore} - {match.awayScore}
                  </p>

                  <p className="mt-1 text-xs uppercase text-gray-400">
                    Completed
                  </p>
                </div>

                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {match.awayTeam.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Management */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tournament Management
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ManagementCard
            title="Manage Teams"
            description="Register teams, assign managers and manage team details."
            href={`/admin/tournaments/${tournament.id}/teams`}
          />

          <ManagementCard
            title="Manage Players"
            description="Register players and manage player eligibility."
            href={`/admin/tournaments/${tournament.id}/players`}
          />

          <ManagementCard
            title="Generate Fixtures"
            description="Create the tournament fixture schedule."
            href={`/admin/tournaments/${tournament.id}/fixtures`}
          />

          <ManagementCard
            title="Manage Matches"
            description="Record scores, match events and match status."
            href={`/admin/tournaments/${tournament.id}/matches`}
          />

          <ManagementCard
            title="Standings"
            description="View the automatically calculated league table."
            href={`/admin/tournaments/${tournament.id}/standings`}
          />

          <ManagementCard
            title="Settings"
            description="Configure tournament rules, points and tie-breakers."
            href={`/admin/tournaments/${tournament.id}/settings`}
          />
        </div>
      </section>

      {/* Competition configuration */}
      {tournament.settings && (
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Competition Configuration
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Format"
              value={tournament.settings.competitionFormat}
            />

            <Info
              label="Teams"
              value={String(tournament.settings.numberOfTeams)}
            />

            <Info
              label="Round Robin"
              value={tournament.settings.roundRobinType}
            />

            <Info
              label="Match Duration"
              value={`${tournament.settings.matchDurationMinutes} mins`}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ManagementCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-400 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>

        <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-900">
          →
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
