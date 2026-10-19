import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="container-page section text-center">
      <h1 className="h1">{t("title")}</h1>
      <p className="lead mx-auto mt-4">{t("text")}</p>
      <Link href="/" className="btn-dark mt-8">{t("back")}</Link>
    </div>
  );
}
