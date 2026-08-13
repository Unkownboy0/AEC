ALTER TABLE "tickets" ADD COLUMN "assignedToUserId" TEXT;
ALTER TABLE "tickets" ADD COLUMN "routedAt" TIMESTAMP(3);
ALTER TABLE "tickets" ADD COLUMN "resolutionRemarks" TEXT;
CREATE INDEX "tickets_assignedToUserId_idx" ON "tickets"("assignedToUserId");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
