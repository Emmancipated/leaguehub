import MatchForm from "./match-form";

type Props = {
  params: Promise<{
    tournamentId: string;
  }>;
};

export default async function NewMatchPage({ params }: Props) {
  const { tournamentId } = await params;

  return <MatchForm tournamentId={tournamentId} />;
}
