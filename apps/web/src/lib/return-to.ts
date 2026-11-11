const allowedReturnPaths = new Set(["/dashboard", "/dynamic-qr-codes"]);

export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  if (allowedReturnPaths.has(value)) return value;
  const editMatch = /^\/dynamic-qr-codes\?edit=([A-Za-z0-9]{20,30})$/.exec(value);
  return editMatch ? `/dynamic-qr-codes?edit=${editMatch[1]}` : "/dashboard";
}
