import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const t = useTranslations("Footer");
  const tn = useTranslations("Header.nav");
  const tc = useTranslations("Common");
  const link = "text-navy-200 hover:text-white";

  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">{t("tagline")}</p>
        </div>
        <nav aria-label={t("navTitle")}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{t("navTitle")}</h2>
          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map(({ key, href }) => (
              <li key={key}><Link href={href} className={link}>{tn(key)}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("legalTitle")}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{t("legalTitle")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal" className={link}>{t("legal")}</Link></li>
            <li><Link href="/privacy" className={link}>{t("privacy")}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {t("rights")}</p>
          <p>{tc("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
