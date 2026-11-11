import type { Metadata } from "next";
import { QRGenerator } from "@/components/qr-generator";

export const metadata: Metadata = {
  title: "Free QR Code Generator",
  description: "Create a free QR code for a website, text, email, SMS, phone number, Wi-Fi network, contact card, or location.",
  alternates: { canonical: "/free-qr-codes" },
  openGraph: { url: "/free-qr-codes" },
};

export default function FreeQrCodesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Free forever · No account needed</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Make a QR code for just about anything.</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#60796e]">
          Pick what you want to share, add the details, and save your code. It is generated right here in your browser.
        </p>
      </div>
      <QRGenerator />
      <div className="mx-auto mt-12 max-w-3xl text-center">
        <h2 className="text-lg font-bold">Static codes, made to last</h2>
        <p className="mt-2 text-sm leading-6 text-[#71877c]">
          A static QR code contains its destination directly in the pattern. It works offline and never expires, but its contents cannot be changed after printing. Check a test scan before sharing anything important.
        </p>
      </div>
    </div>
  );
}
