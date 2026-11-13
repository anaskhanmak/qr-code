import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DynamicQRBuilder, type DynamicQRInitialData } from "@/components/dynamic-qr-builder";
import { db } from "@loopmark/db";
import { parseDynamicContent } from "@/lib/dynamic-qr";
import { parseQRDesign } from "@/lib/qr-design";

export const metadata: Metadata = {
  title: "Dynamic QR Code Builder",
  description: "Create an editable QR code for a website, contact card, PDF, or multiple links.",
  alternates: { canonical: "/dynamic-qr-codes" },
  openGraph: { url: "/dynamic-qr-codes" },
};

export default async function DynamicQRBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  const { edit } = await searchParams;
  let initialData: DynamicQRInitialData | undefined;
  if (edit) {
    if (!session?.user?.id) redirect(`/login?next=${encodeURIComponent(`/dynamic-qr-codes?edit=${edit}`)}`);
    const qrCode = await db.qRCode.findFirst({
      where: {
        id: edit,
        kind: "DYNAMIC",
        workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "EDITOR"] } } } },
      },
      select: { id: true, name: true, slug: true, content: true, design: true },
    });
    const content = qrCode ? parseDynamicContent(qrCode.content) : null;
    if (!qrCode || !qrCode.slug || !content) notFound();
    initialData = { id: qrCode.id, name: qrCode.name, slug: qrCode.slug, content, design: parseQRDesign(qrCode.design) };
  }
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">{initialData ? "Keep your link current" : "Create once · Keep it current"}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{initialData ? "Update your dynamic QR." : "One scan, a more useful next step."}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#60796e]">
          Make a dynamic QR for a website, contact card, PDF, or link collection. Change where it leads later, without changing the printed code.
        </p>
      </div>
      <DynamicQRBuilder signedIn={Boolean(session?.user?.id)} initialData={initialData} />
    </div>
  );
}
