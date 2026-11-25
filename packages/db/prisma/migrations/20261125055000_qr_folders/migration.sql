CREATE TABLE "QRFolder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRFolder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QRCode" ADD COLUMN "folderId" TEXT;

CREATE UNIQUE INDEX "QRFolder_workspaceId_name_key" ON "QRFolder"("workspaceId", "name");
CREATE INDEX "QRFolder_workspaceId_createdAt_idx" ON "QRFolder"("workspaceId", "createdAt");
CREATE INDEX "QRCode_folderId_createdAt_idx" ON "QRCode"("folderId", "createdAt");

ALTER TABLE "QRFolder" ADD CONSTRAINT "QRFolder_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "QRFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
