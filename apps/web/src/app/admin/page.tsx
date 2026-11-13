import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { canManageCms, canManageModeration, canManagePlans, getAdminRoleForEmail } from "@/lib/admin-access";

export const metadata = {
  title: "Admin dashboard",
  description: "Moderation, pricing, and CMS controls for the Loopmark platform.",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?next=%2Fadmin");
  }

  const adminRole = getAdminRoleForEmail(session.user.email);
  if (!adminRole) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Admin</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#173a32]">Platform control center</h1>
      </div>

      <section className="mt-10 rounded-3xl border border-[#e3e9de] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#173a32]">Admin access verified</h2>
        <p className="mt-3 max-w-2xl leading-7 text-[#60796e]">
          This account is on the server-configured admin allowlist. Live platform reporting, moderation actions, pricing management, and CMS editing are not connected yet, so no sample or fabricated records are shown.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-[#425d52] sm:grid-cols-3">
          <li>{canManageModeration(adminRole) ? "Moderation permission enabled" : "Moderation permission unavailable"}</li>
          <li>{canManagePlans(adminRole) ? "Pricing permission enabled" : "Pricing permission unavailable"}</li>
          <li>{canManageCms(adminRole) ? "CMS permission enabled" : "CMS permission unavailable"}</li>
        </ul>
      </section>
    </main>
  );
}
