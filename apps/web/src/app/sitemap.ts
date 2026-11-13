import type { MetadataRoute } from "next";

const staticRoutes = [
  "/",
  "/about",
  "/blog",
  "/contact-enterprise",
  "/dynamic-qr-codes",
  "/free-qr-codes",
  "/login",
  "/pricing",
  "/privacy",
  "/refund-policy",
  "/register",
  "/terms",
  "/verify-email",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return staticRoutes.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
