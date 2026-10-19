"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import { PROFILES, contactSchema, type ContactData, type ContactInput } from "@/lib/contact-schema";

const field =
  "w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 placeholder:text-navy-400 aria-[invalid=true]:border-red-600";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{msg}</p> : null;
}

export function ContactForm() {
  const t = useTranslations("Contact");
  const params = useSearchParams();
  const initialProfile = PROFILES.find((p) => p === params.get("profile"));
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput, unknown, ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", organization: "", message: "", website: "", profile: initialProfile },
  });

  const onSubmit = async (data: ContactData) => {
    setServerError(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
      reset();
    } catch {
      setServerError(true);
    }
  };

  const err = (key?: string) => (key ? t(`errors.${key}`) : undefined);

  if (sent) {
    return (
      <div role="status" className="card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/20 text-2xl text-navy-800" aria-hidden="true">✓</div>
        <h2 className="text-2xl font-bold">{t("success.title")}</h2>
        <p className="mt-3 text-navy-700">{t("success.text")}</p>
        <button type="button" className="btn-dark mt-6" onClick={() => setSent(false)}>
          {t("success.again")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5">
      <p className="text-sm text-navy-700">{t("form.required")}</p>

      <div>
        <label htmlFor="name" className="mb-1.5 block font-semibold">{t("form.name")}</label>
        <input id="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby="name-err" {...register("name")} />
        <FieldError id="name-err" msg={err(errors.name?.message)} />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block font-semibold">{t("form.email")}</label>
        <input id="email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby="email-err" {...register("email")} />
        <FieldError id="email-err" msg={err(errors.email?.message)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile" className="mb-1.5 block font-semibold">{t("form.profile")}</label>
          <select id="profile" className={field} aria-invalid={!!errors.profile} aria-describedby="profile-err" defaultValue={initialProfile ?? ""} {...register("profile")}>
            <option value="" disabled>{t("form.profilePlaceholder")}</option>
            {PROFILES.map((p) => (
              <option key={p} value={p}>{t(`form.profiles.${p}`)}</option>
            ))}
          </select>
          <FieldError id="profile-err" msg={err(errors.profile?.message)} />
        </div>
        <div>
          <label htmlFor="organization" className="mb-1.5 block font-semibold">
            {t("form.organization")} <span className="font-normal text-navy-500">{t("form.optional")}</span>
          </label>
          <input id="organization" autoComplete="organization" className={field} {...register("organization")} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block font-semibold">{t("form.message")}</label>
        <textarea id="message" rows={6} className={field} aria-invalid={!!errors.message} aria-describedby="message-err" {...register("message")} />
        <FieldError id="message-err" msg={err(errors.message?.message)} />
      </div>

      {/* Champ piège anti-spam, invisible pour les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input id="consent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-navy-700" aria-invalid={!!errors.consent} aria-describedby="consent-err" {...register("consent")} />
          <label htmlFor="consent" className="text-sm leading-relaxed text-navy-700">
            {t("form.consent")}{" "}
            <Link href="/privacy" className="font-semibold underline">{t("form.privacyLink")}</Link>
          </label>
        </div>
        <FieldError id="consent-err" msg={err(errors.consent?.message)} />
      </div>

      {serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{t("errors.server")}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-dark w-full disabled:opacity-60 sm:w-auto">
        {isSubmitting ? t("form.sending") : t("form.submit")}
      </button>
    </form>
  );
}
