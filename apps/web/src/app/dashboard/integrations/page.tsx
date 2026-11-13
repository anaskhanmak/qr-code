import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { CreateWorkspaceApiKeyForm, RevokeWorkspaceApiKeyForm } from "@/components/workspace-api-key-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations", robots: { index: false } };

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      apiKeys: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, keyPrefix: true, scopes: true, expiresAt: true, revokedAt: true, createdAt: true, lastUsedAt: true },
      },
    },
  });
  if (!workspace) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">{workspace.name}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Integrations</h1>
      <section className="mt-8 rounded-3xl border border-[#e3e9de] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">API keys</h2>
        <p className="mt-2 text-sm leading-6 text-[#71877c]">Keys are shown only once. Store them in a secret manager and send them as a Bearer token. The API currently exposes dynamic QR list/create endpoints at <code>/api/v1/qrs</code>.</p>
        <CreateWorkspaceApiKeyForm workspaceId={workspace.id} />
      </section>
      <section className="mt-8 rounded-3xl border border-[#e3e9de] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">Existing keys</h2>
        {workspace.apiKeys.length ? (
          <ul className="mt-5 divide-y divide-[#e3e9de]">
            {workspace.apiKeys.map((key) => (
              <li key={key.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">{key.name} <code className="ml-2 text-xs font-normal text-[#71877c]">{key.keyPrefix}…</code></p>
                  <p className="mt-1 text-xs text-[#71877c]">Scopes: {key.scopes.join(", ")} · Created {key.createdAt.toLocaleDateString()} · {key.lastUsedAt ? `Used ${key.lastUsedAt.toLocaleDateString()}` : "Not used yet"}</p>
                  <p className="mt-1 text-xs text-[#71877c]">{key.revokedAt ? `Revoked ${key.revokedAt.toLocaleDateString()}` : key.expiresAt ? `Expires ${key.expiresAt.toLocaleDateString()}` : "No expiry"}</p>
                </div>
                {!key.revokedAt && <RevokeWorkspaceApiKeyForm workspaceId={workspace.id} apiKeyId={key.id} />}
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-[#71877c]">No API keys have been created.</p>}
      </section>
    </main>
  );
}
