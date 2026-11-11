import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e1e7dc] bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#647d75] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="font-bold text-[#173a32]">loopmark</Link>
        <p>Make a mark that keeps working.</p>
        <nav aria-label="Footer navigation" className="flex gap-5">
          <Link className="hover:text-[#173a32]" href="/free-qr-codes">Free QR codes</Link>
          <Link className="hover:text-[#173a32]" href="/dynamic-qr-codes">Dynamic QR</Link>
          <Link className="hover:text-[#173a32]" href="/login">Account</Link>
        </nav>
      </div>
    </footer>
  );
}
