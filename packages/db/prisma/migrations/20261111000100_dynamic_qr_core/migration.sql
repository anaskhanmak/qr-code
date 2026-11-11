-- Add redirect expiry support for dynamic QR codes.
ALTER TABLE "QRCode"
ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "QRCode_slug_kind_status_idx" ON "QRCode"("slug", "kind", "status");
