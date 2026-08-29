import MatchesClient from "./matches-client";

type Props = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export default async function MatchesPage({ params }: Props) {
  const { tournamentId } = await params;

  return (
    <MatchesClient tournamentId={tournamentId} />
  );
}
