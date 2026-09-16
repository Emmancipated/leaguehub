-- AlterTable
ALTER TABLE "MatchEvent" ADD COLUMN "assistedByPlayerId" TEXT;
ALTER TABLE "MatchEvent" ADD COLUMN "assistedByMatchPlayerId" TEXT;

-- CreateIndex
CREATE INDEX "MatchEvent_assistedByPlayerId_idx" ON "MatchEvent"("assistedByPlayerId");
CREATE INDEX "MatchEvent_assistedByMatchPlayerId_idx" ON "MatchEvent"("assistedByMatchPlayerId");

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_assistedByPlayerId_fkey" FOREIGN KEY ("assistedByPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_assistedByMatchPlayerId_fkey" FOREIGN KEY ("assistedByMatchPlayerId") REFERENCES "MatchPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;