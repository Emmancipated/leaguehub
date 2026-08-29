import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TournamentShell } from "@/components/public/tournament-shell";

type TournamentLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default async function TournamentLayout({
  children,
  params,
}: TournamentLayoutProps) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  return <TournamentShell tournament={tournament}>{children}</TournamentShell>;
}
