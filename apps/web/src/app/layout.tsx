import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Loopmark — QR codes that keep up",
    template: "%s · Loopmark",
  },
  description:
    "Create a free QR code in seconds. Make a clear, reliable connection from the printed world to wherever you want people to go.",
  openGraph: {
    title: "Loopmark — QR codes that keep up",
    description: "Make a clear connection from the printed world to wherever you want people to go.",
    siteName: "Loopmark",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
