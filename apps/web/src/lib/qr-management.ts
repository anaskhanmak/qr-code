const qrIdPattern = /^[a-zA-Z0-9_-]{1,40}$/;

export function parseBulkQrIds(values: unknown[]): { ids: string[] } | { error: string } {
  if (
    values.length < 1 ||
    values.length > 50 ||
    values.some((value) => typeof value !== "string" || !qrIdPattern.test(value))
  ) {
    return { error: "Select between 1 and 50 valid QR codes." };
  }
  const ids = [...new Set(values as string[])];
  if (ids.length !== values.length) return { error: "Duplicate QR code selections are not allowed." };
  return { ids };
}
