import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { pagePath } from "@/lib/page-metadata";

const PAGES = ["home", "machine", "mdiag", "pharmacies", "investors", "contact", "legal", "privacy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    routing.locales.map((locale) => ({ url: `${SITE_URL}${pagePath(locale, page)}`, lastModified: new Date() })),
  );
}
