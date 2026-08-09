-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "retentionDaysEffectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SystemConfigHistory" (
    "id" SERIAL NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfigHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoRetention" (
    "id" SERIAL NOT NULL,
    "repoName" TEXT NOT NULL,
    "initialCreatedAt" TIMESTAMP(3) NOT NULL,
    "computedDeletionDate" TIMESTAMP(3) NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoRetention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemConfigHistory_effectiveAt_idx" ON "SystemConfigHistory"("effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "RepoRetention_repoName_key" ON "RepoRetention"("repoName");
