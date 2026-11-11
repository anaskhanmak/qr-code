import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-3xl border border-[#e3e9de] bg-white p-8 text-center shadow-[0_25px_70px_-45px_#385b48]">
        <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#c5f277] text-xl font-bold text-[#173a32]">L</span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">That link went a little off the map.</h1>
        <p className="mt-3 text-sm leading-6 text-[#71877c]">This page does not exist. Double-check the link or head back to Loopmark.</p>
        <Link href="/" className="focus-ring mt-6 inline-block rounded-xl bg-[#173a32] px-5 py-3 text-sm font-bold text-white hover:bg-[#275749]">Back to Loopmark</Link>
      </section>
    </main>
  );
}
