import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="focus-ring flex items-center gap-2 rounded-md font-bold tracking-tight">
        <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-[#173a32] text-lg text-[#c5f277]">
          L
        </span>
        <span className="text-xl">loopmark</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-6">
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/about">
          About
        </Link>
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/free-qr-codes">
          Free QR codes
        </Link>
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/dynamic-qr-codes">
          Dynamic QR
        </Link>
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/pricing">
          Pricing
        </Link>
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/blog">
          Blog
        </Link>
        <Link className="focus-ring hidden rounded px-2 py-2 text-sm text-[#526c63] hover:text-[#173a32] sm:block" href="/#how-it-works">
          How it works
        </Link>
        <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-[#173a32] hover:bg-white" href="/login">
          Sign in
        </Link>
        <Link className="focus-ring rounded-lg bg-[#c5f277] px-4 py-2.5 text-sm font-bold text-[#173a32] shadow-sm hover:bg-[#b6e865]" href="/register">
          Get started
        </Link>
      </nav>
    </header>
  );
}
