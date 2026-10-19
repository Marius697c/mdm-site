import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/contact-schema";

export const runtime = "nodejs";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const data = parsed.data;

  // Anti-spam : un robot a rempli le champ caché, on feint le succès.
  if (data.website) return NextResponse.json({ ok: true });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "MDM <onboarding@resend.dev>";
  if (!apiKey || !to) {
    console.error("Contact: RESEND_API_KEY ou CONTACT_TO_EMAIL manquant.");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `[MDM] Nouveau message — ${data.profile}`,
    html: `
      <h2>Nouveau message depuis le site MDM</h2>
      <p><strong>Nom :</strong> ${escapeHtml(data.name)}</p>
      <p><strong>E-mail :</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Profil :</strong> ${escapeHtml(data.profile)}</p>
      <p><strong>Organisation :</strong> ${escapeHtml(data.organization || "—")}</p>
      <p><strong>Message :</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
    `,
    text: `Nom: ${data.name}\nE-mail: ${data.email}\nProfil: ${data.profile}\nOrganisation: ${data.organization || "-"}\n\n${data.message}`,
  });

  if (error) {
    console.error("Contact: échec Resend", error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
