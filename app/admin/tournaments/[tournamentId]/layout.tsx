import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNav from "./_components/admin-nav";
import LogoutButton from "./_components/logout-button";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    tournamentId: string;
  }>;
};

function getStatusClasses(status: string) {
  switch (status) {
    case "LIVE":
      return "bg-red-50 text-red-700 ring-red-200";
    case "REGISTRATION":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700 ring-gray-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
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

export default async function AdminTournamentLayout({
  children,
  params,
}: Props) {
  const { tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      description: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center sm:py-6">
            <div className="min-w-0">
              <Link
                href="/admin/tournaments"
                className="mb-2 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                ← All Tournaments
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {tournament.name}
                </h1>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                    tournament.status,
                  )}`}
                >
                  {getStatusLabel(tournament.status)}
                </span>
              </div>

              {tournament.description && (
                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                  {tournament.description}
                </p>
              )}
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <AdminNav tournamentId={tournamentId} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
