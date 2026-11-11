export async function invalidateRedirectCache(slug: string): Promise<boolean> {
  const shortLinkBase = process.env.NEXT_PUBLIC_SHORT_URL;
  if (!shortLinkBase) return true;

  const secret = process.env.REDIRECT_REVALIDATION_SECRET;
  if (!secret) {
    console.error("Dynamic QR content changed, but REDIRECT_REVALIDATION_SECRET is not configured.");
    return false;
  }

  try {
    const url = new URL(`__invalidate/${encodeURIComponent(slug)}`, `${shortLinkBase.replace(/\/+$/, "")}/`);
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) return true;
    console.error("Redirect cache invalidation returned an error.", response.status);
    return false;
  } catch (error) {
    console.error("Redirect cache invalidation failed.", error);
    return false;
  }
}
