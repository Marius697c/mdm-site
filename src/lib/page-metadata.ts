import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type PageKey = "home" | "machine" | "mdiag" | "pharmacies" | "investors" | "contact" | "legal" | "privacy";

const PATHS: Record<PageKey, string> = {
  home: "", machine: "/machine", mdiag: "/mdiag", pharmacies: "/pharmacies",
  investors: "/investors", contact: "/contact", legal: "/legal", privacy: "/privacy",
};

export const pagePath = (locale: string, page: PageKey) =>
  `${locale === routing.defaultLocale ? "" : `/${locale}`}${PATHS[page]}` || "/";

export async function buildMetadata(locale: string, page: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Meta.pages" });
  return {
    title: page === "home" ? { absolute: `MDM — ${t("home.title")}` } : t(`${page}.title`),
    description: t(`${page}.description`),
    alternates: {
      canonical: pagePath(locale, page),
      languages: Object.fromEntries(routing.locales.map((l) => [l, pagePath(l, page)])),
    },
  };
}
