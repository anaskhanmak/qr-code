"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveDynamicQRAction, type SaveDynamicQRState } from "@/app/actions/dynamic-qr-actions";
import { QrCanvas } from "@/components/qr-canvas";
import {
  dynamicContentSchemas,
  dynamicQRTypes,
  getShortUrl,
  type DynamicQRContent,
  type DynamicQRType,
} from "@/lib/dynamic-qr";

const typeTitles: Record<DynamicQRType, string> = {
  url: "Website",
  business_card: "Business card",
  pdf: "PDF",
  multiple_links: "Multiple links",
};

const typeDescriptions: Record<DynamicQRType, string> = {
  url: "Send each scan directly to the right page.",
  business_card: "Share a contact page with a ready-to-save contact card.",
  pdf: "Make a mobile-friendly page for a menu, guide, or document.",
  multiple_links: "Bring your most useful links together in one place.",
};

const initialFields: Record<string, string> = {
  title: "A page worth visiting",
  name: "My first QR code",
  url: "https://example.com",
  fullName: "",
  role: "",
  organization: "",
  phone: "",
  email: "",
  website: "",
  bio: "",
  description: "",
  pdfUrl: "",
};

type LinkItem = { label: string; url: string };
type BuilderDraft = { type: DynamicQRType; fields: Record<string, string>; links: LinkItem[] };
type BuilderStep = 1 | 2 | 3;
export type DynamicQRInitialData = {
  id: string;
  slug: string;
  name: string;
  content: DynamicQRContent;
};

const fieldClass =
  "focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-3.5 py-3 text-sm text-[#173a32] placeholder:text-[#97a69d]";
const draftKey = "loopmark.dynamic-qr-draft";

export function DynamicQRBuilder({
  signedIn,
  initialData,
}: {
  signedIn: boolean;
  initialData?: DynamicQRInitialData;
}) {
  const [type, setType] = useState<DynamicQRType>(initialData?.content.type ?? "url");
  const [fields, setFields] = useState(() => ({
    ...initialFields,
    ...(initialData ? fieldsFromContent(initialData) : {}),
  }));
  const [links, setLinks] = useState<LinkItem[]>(() =>
    initialData?.content.type === "multiple_links"
      ? initialData.content.links
      : [{ label: "My website", url: "https://example.com" }],
  );
  const qrId = initialData?.id ?? "";
  const [step, setStep] = useState<BuilderStep>(1);
  const [previewSlug, setPreviewSlug] = useState(initialData?.slug ?? "your-link");
  const [validationMessage, setValidationMessage] = useState("");
  const [actionState, formAction, pending] = useActionState<SaveDynamicQRState, FormData>(
    saveDynamicQRAction,
    {},
  );
  const router = useRouter();
  const restored = useRef(false);

  useEffect(() => {
    if (!initialData) setPreviewSlug(crypto.randomUUID().replaceAll("-", "").slice(0, 16));
    try {
      if (initialData) {
        restored.current = true;
        return;
      }
      const storedDraft = localStorage.getItem(draftKey);
      if (!storedDraft) return;
      const draft = JSON.parse(storedDraft) as Partial<BuilderDraft>;
      if (!draft.type || !dynamicQRTypes.includes(draft.type)) return;
      if (!draft.fields || typeof draft.fields !== "object") return;
      setType(draft.type);
      setFields({ ...initialFields, ...draft.fields });
      if (Array.isArray(draft.links)) {
        setLinks(draft.links.filter(
          (item): item is LinkItem =>
            typeof item?.label === "string" && typeof item?.url === "string",
        ).slice(0, 12));
      }
    } catch (error) {
      console.warn("The saved QR draft could not be restored.", error);
    } finally {
      restored.current = true;
    }
  }, [initialData]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ type, fields, links } satisfies BuilderDraft));
    } catch (error) {
      console.warn("The QR draft could not be saved in this browser.", error);
    }
  }, [fields, links, type]);

  useEffect(() => {
    if (!actionState.slug) return;
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.warn("The saved QR draft could not be removed from this browser.", error);
    }
    const warning = actionState.warning ? "&cacheRefresh=delayed" : "";
    router.push(`/dashboard?${actionState.updated ? "updated" : "created"}=${encodeURIComponent(actionState.slug)}${warning}`);
  }, [actionState.slug, actionState.updated, actionState.warning, router]);

  const content = useMemo(() => {
    switch (type) {
      case "url":
        return { type, title: fields.title, url: fields.url };
      case "business_card":
        return {
          type,
          title: fields.title,
          fullName: fields.fullName,
          role: fields.role,
          organization: fields.organization,
          phone: fields.phone,
          email: fields.email,
          website: fields.website,
          bio: fields.bio,
        };
      case "pdf":
        return { type, title: fields.title, description: fields.description, pdfUrl: fields.pdfUrl };
      case "multiple_links":
        return { type, title: fields.title, description: fields.description, links };
    }
  }, [fields, links, type]);

  const contentSchema = dynamicContentSchemas[type];
  const parsedContent = contentSchema.safeParse(content);
  const shortUrl = getShortUrl(previewSlug);
  const title = fields.title || typeTitles[type];
  const encodedContent = JSON.stringify(content);

  function updateField(key: string, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function changeType(nextType: DynamicQRType) {
    setType(nextType);
    setValidationMessage("");
  }

  function continueToDetails() {
    setStep(2);
  }

  function reviewCode() {
    const result = contentSchema.safeParse(content);
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Check your details before continuing.");
      return;
    }
    setValidationMessage("");
    setStep(3);
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]" aria-label="Dynamic QR code builder">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-5 shadow-[0_20px_70px_-45px_#385b48] sm:p-8">
        <ol aria-label="Builder steps" className="mb-7 grid grid-cols-3 gap-2">
          {(["Choose", "Add details", "Save"] as const).map((label, index) => {
            const stepNumber = (index + 1) as BuilderStep;
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-current={step === stepNumber ? "step" : undefined}
                  onClick={() => stepNumber < step ? setStep(stepNumber) : undefined}
                  className={`focus-ring w-full rounded-xl px-2 py-3 text-xs font-bold sm:text-sm ${
                    step === stepNumber
                      ? "bg-[#173a32] text-white"
                      : stepNumber < step
                        ? "bg-[#eff6e7] text-[#426546]"
                        : "bg-[#f3f5ef] text-[#81948a]"
                  }`}
                >
                  <span className="mr-1.5 opacity-70">0{stepNumber}</span>{label}
                </button>
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Choose a dynamic type</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">What are you sharing?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {dynamicQRTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeType(option)}
                  aria-pressed={type === option}
                  className={`focus-ring rounded-2xl border p-4 text-left transition ${
                    type === option
                      ? "border-[#557b52] bg-[#f0f6e8]"
                      : "border-[#e4e9e1] bg-white hover:bg-[#f9faf7]"
                  }`}
                >
                  <span className="font-bold text-[#21463a]">{typeTitles[option]}</span>
                  <span className="mt-1.5 block text-sm leading-5 text-[#71877c]">{typeDescriptions[option]}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={continueToDetails} className="focus-ring mt-6 w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Step 2 · Add your details</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{typeTitles[type]} content</h2>
            <div className="mt-5 space-y-4">
              <Field label="Page title" value={fields.title} onChange={(value) => updateField("title", value)} placeholder="A page worth visiting" />
              {type === "url" && (
                <Field label="Destination URL" value={fields.url} onChange={(value) => updateField("url", value)} placeholder="https://example.com" type="url" />
              )}
              {type === "business_card" && (
                <>
                  <Field label="Full name" value={fields.fullName} onChange={(value) => updateField("fullName", value)} placeholder="Alex Morgan" />
                  <Field label="Role or job title" value={fields.role} onChange={(value) => updateField("role", value)} placeholder="Designer" required={false} />
                  <Field label="Organization" value={fields.organization} onChange={(value) => updateField("organization", value)} placeholder="Studio North" required={false} />
                  <Field label="Phone number" value={fields.phone} onChange={(value) => updateField("phone", value)} placeholder="+1 555 123 4567" required={false} />
                  <Field label="Email address" value={fields.email} onChange={(value) => updateField("email", value)} placeholder="alex@example.com" type="email" required={false} />
                  <Field label="Website" value={fields.website} onChange={(value) => updateField("website", value)} placeholder="https://example.com" type="url" required={false} />
                  <TextAreaField label="Short introduction" value={fields.bio} onChange={(value) => updateField("bio", value)} placeholder="A few words about what you do" />
                </>
              )}
              {type === "pdf" && (
                <>
                  <TextAreaField label="A short introduction" value={fields.description} onChange={(value) => updateField("description", value)} placeholder="Tell people what they will find in this document." />
                  <Field label="PDF link" value={fields.pdfUrl} onChange={(value) => updateField("pdfUrl", value)} placeholder="https://example.com/menu.pdf" type="url" />
                  <p className="text-xs leading-5 text-[#81948a]">Upload your PDF to a public HTTPS link for now. File uploads and storage are part of a later phase.</p>
                </>
              )}
              {type === "multiple_links" && (
                <>
                  <TextAreaField label="Short introduction" value={fields.description} onChange={(value) => updateField("description", value)} placeholder="A few words before the links." />
                  {links.map((link, index) => (
                    <fieldset key={index} className="rounded-xl border border-[#e4e9e1] p-3">
                      <legend className="px-1 text-xs font-bold text-[#557166]">Link {index + 1}</legend>
                      <label className="block text-sm font-semibold text-[#284b40]">
                        Link label
                        <input className={fieldClass} value={link.label} maxLength={80} onChange={(event) => updateLink(index, "label", event.target.value)} />
                      </label>
                      <label className="mt-3 block text-sm font-semibold text-[#284b40]">
                        Website address
                        <input type="url" className={fieldClass} value={link.url} maxLength={2048} placeholder="https://example.com" onChange={(event) => updateLink(index, "url", event.target.value)} />
                      </label>
                      {links.length > 1 && (
                        <button type="button" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="focus-ring mt-3 rounded text-xs font-semibold text-[#8c4e3e] underline underline-offset-2">Remove link</button>
                      )}
                    </fieldset>
                  ))}
                  {links.length < 12 && (
                    <button type="button" onClick={() => setLinks((current) => [...current, { label: "", url: "" }])} className="focus-ring rounded-lg px-2 py-2 text-sm font-bold text-[#426546] underline underline-offset-4">+ Add another link</button>
                  )}
                </>
              )}
              <label className="block text-sm font-semibold text-[#284b40]">
                Name this QR code
                <input className={fieldClass} value={fields.name} maxLength={120} onChange={(event) => updateField("name", event.target.value)} placeholder="For example, Summer menu" />
              </label>
              {validationMessage && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{validationMessage}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="focus-ring rounded-xl border border-[#dce4d9] px-4 py-3 text-sm font-semibold">Back</button>
                <button type="button" onClick={reviewCode} className="focus-ring flex-1 rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">Review my QR</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Step 3 · Your dynamic QR</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Ready for the real world</h2>
            <p className="mt-3 text-sm leading-6 text-[#71877c]">This QR points to a Loopmark short link. You can update its destination or page content later without reprinting the code.</p>
            <div className="mt-5 rounded-2xl bg-[#f4f7ef] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#77907c]">Your short link</p>
              <p className="mt-2 break-all text-sm font-semibold text-[#315947]">{shortUrl}</p>
            </div>
            <label className="mt-4 block text-sm font-semibold text-[#284b40]">
              QR code name
              <input className={fieldClass} value={fields.name} maxLength={120} onChange={(event) => updateField("name", event.target.value)} />
            </label>
            {validationMessage && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{validationMessage}</p>}
            {actionState.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{actionState.error}</p>}
            {actionState.warning && <p role="status" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{actionState.warning}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="focus-ring rounded-xl border border-[#dce4d9] px-4 py-3 text-sm font-semibold">Edit details</button>
              {signedIn ? (
                <form action={formAction} className="flex-1">
                  {qrId && <input type="hidden" name="qrId" value={qrId} />}
                  <input type="hidden" name="name" value={fields.name} />
                  <input type="hidden" name="content" value={encodedContent} />
                  <button disabled={pending || !parsedContent.success || !fields.name.trim()} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749] disabled:cursor-not-allowed disabled:opacity-50">
                    {pending ? "Saving..." : qrId ? "Update QR content" : "Save dynamic QR"}
                  </button>
                </form>
              ) : (
                <Link
                  href="/register?next=%2Fdynamic-qr-codes"
                  className="focus-ring flex-1 rounded-xl bg-[#c5f277] px-4 py-3.5 text-center text-sm font-bold text-[#173a32] hover:bg-[#b6e865]"
                >
                  Create account to save
                </Link>
              )}
            </div>
            {!signedIn && <p className="mt-3 text-xs leading-5 text-[#81948a]">Your draft stays in this browser while you create your free account and verify your email.</p>}
          </div>
        )}
      </div>

      <aside className="flex flex-col items-center rounded-3xl bg-[#eaf0e4] p-6 text-center sm:p-8">
        <p className="self-start text-left text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Live preview</p>
        <div className="my-5 w-full max-w-[330px] rounded-[2rem] border-[7px] border-[#173a32] bg-white px-4 pb-5 pt-4 shadow-xl">
          <div aria-hidden className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#dce4d9]" />
          <div className="rounded-2xl bg-[#f5f7f1] p-4">
            <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#c5f277] font-bold text-[#173a32]">L</div>
            <h3 className="mt-3 text-lg font-bold text-[#21463a]">{title}</h3>
            <PreviewContent type={type} fields={fields} links={links} />
          </div>
        </div>
        <div className="grid size-[272px] place-items-center rounded-[2rem] bg-white p-4 shadow-[0_15px_45px_-30px_#173a32]">
          <QrCanvas value={shortUrl} label={`Preview QR code for ${shortUrl}`} />
        </div>
        <p className="mt-4 max-w-sm text-xs leading-5 text-[#789087]">The preview link activates when you save this code. Static QRs encode content; dynamic QRs send scans through this editable link.</p>
      </aside>
    </section>
  );

  function updateLink(index: number, key: keyof LinkItem, value: string) {
    setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }
}

function fieldsFromContent(initialData: DynamicQRInitialData): Record<string, string> {
  const content = initialData.content;
  const fields: Record<string, string> = { title: content.title, name: initialData.name };
  switch (content.type) {
    case "url":
      fields.url = content.url;
      break;
    case "business_card":
      fields.fullName = content.fullName;
      fields.role = content.role;
      fields.organization = content.organization;
      fields.phone = content.phone;
      fields.email = content.email;
      fields.website = content.website;
      fields.bio = content.bio;
      break;
    case "pdf":
      fields.description = content.description;
      fields.pdfUrl = content.pdfUrl;
      break;
    case "multiple_links":
      fields.description = content.description;
      break;
  }
  return fields;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-[#284b40]">
      {label}
      <input type={type} required={required} className={fieldClass} value={value} maxLength={2048} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#284b40]">
      {label}
      <textarea className={`${fieldClass} min-h-20 resize-y`} maxLength={500} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PreviewContent({
  type,
  fields,
  links,
}: {
  type: DynamicQRType;
  fields: Record<string, string>;
  links: LinkItem[];
}) {
  if (type === "url") {
    return (
      <div className="mt-3 rounded-xl bg-white px-3 py-3 text-left">
        <p className="truncate text-sm font-semibold text-[#315947]">{fields.url || "Your destination"}</p>
        <p className="mt-1 text-xs text-[#81948a]">Opens your website</p>
      </div>
    );
  }
  if (type === "business_card") {
    return (
      <div className="mt-3 text-sm text-[#61796e]">
        <p>{fields.fullName || "Your name"}</p>
        {fields.role && <p className="mt-1 text-xs">{fields.role}{fields.organization ? ` · ${fields.organization}` : ""}</p>}
        {fields.email && <p className="mt-2 truncate text-xs">{fields.email}</p>}
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold">Save contact</p>
      </div>
    );
  }
  if (type === "pdf") {
    return (
      <div className="mt-3 rounded-xl bg-white p-3 text-left">
        <p className="text-sm font-semibold text-[#315947]">PDF document</p>
        <p className="mt-1 text-xs text-[#81948a]">{fields.description || "Ready to read on your phone"}</p>
        <p className="mt-3 text-xs font-bold text-[#315947]">View document →</p>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      {links.slice(0, 3).map((link, index) => (
        <p key={index} className="truncate rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#315947]">{link.label || "Your link"}</p>
      ))}
    </div>
  );
}
