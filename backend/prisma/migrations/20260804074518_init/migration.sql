-- CreateEnum
CREATE TYPE "ExpiryAction" AS ENUM ('DELETE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH_LEAD', 'ENGINEERING_MANAGER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CONFIG_UPDATED', 'REPO_ARCHIVED', 'REPO_DELETED', 'OVERRIDE_CREATED', 'OVERRIDE_REMOVED', 'COLLABORATOR_REMOVED', 'BULK_COLLABORATOR_REMOVAL', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "repoPrefix" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "defaultExpiryAction" "ExpiryAction" NOT NULL,
    "preDeletionWarningDays" INTEGER NOT NULL,
    "githubOrgName" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoOverride" (
    "id" SERIAL NOT NULL,
    "repoName" TEXT NOT NULL,
    "overrideDeletionDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "setBy" TEXT NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "actor" TEXT NOT NULL,
    "actionType" "AuditAction" NOT NULL,
    "targetRepo" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "repoName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepoOverride_repoName_key" ON "RepoOverride"("repoName");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_targetRepo_idx" ON "AuditLog"("targetRepo");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubUsername_key" ON "User"("githubUsername");

-- CreateIndex
CREATE INDEX "Notification_repoName_idx" ON "Notification"("repoName");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
