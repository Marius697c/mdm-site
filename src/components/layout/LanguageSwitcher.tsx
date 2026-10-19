"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={t("language")} className="inline-flex rounded-full border border-navy-200 p-0.5 text-sm font-semibold">
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={code === locale}
          onClick={() => router.replace(pathname, { locale: code })}
          className={`rounded-full px-3 py-1 uppercase transition-colors ${
            code === locale ? "bg-navy-800 text-white" : "text-navy-700 hover:bg-navy-50"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
