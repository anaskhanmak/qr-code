CREATE TABLE "QRFormResponse" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRFormResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QRFormResponse_qrCodeId_createdAt_idx" ON "QRFormResponse"("qrCodeId", "createdAt");
CREATE INDEX "QRFormResponse_workspaceId_createdAt_idx" ON "QRFormResponse"("workspaceId", "createdAt");

ALTER TABLE "QRFormResponse" ADD CONSTRAINT "QRFormResponse_qrCodeId_fkey"
FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QRFormResponse" ADD CONSTRAINT "QRFormResponse_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
