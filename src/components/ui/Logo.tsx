import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = { tone?: "light" | "dark" };

/** Logo texte provisoire, en attendant le logo définitif. */
export function Logo({ tone = "dark" }: Props) {
  const t = useTranslations("Header");
  const main = tone === "dark" ? "text-navy-900" : "text-white";
  const sub = tone === "dark" ? "text-navy-500" : "text-navy-200";
  return (
    <Link href="/" aria-label={t("logoLabel")} className="inline-flex flex-col leading-none">
      <span className={`text-2xl font-extrabold tracking-[0.18em] ${main}`}>
        MDM<span className="text-cyan-500">.</span>
      </span>
      <span className={`mt-1 text-xs font-medium ${sub}`}>{t("by")}</span>
    </Link>
  );
}
