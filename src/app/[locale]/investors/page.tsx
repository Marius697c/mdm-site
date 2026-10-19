import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/page-metadata";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Steps } from "@/components/ui/Steps";
import { CtaBanner } from "@/components/ui/CtaBanner";

type Item = { title: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "investors");
}

export default async function InvestorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Investors");

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} text={t("hero.text")} />
      <Section id="vision" eyebrow={t("vision.eyebrow")} title={t("vision.title")} text={t("vision.text")} />
      <Section id="roadmap" tone="soft" eyebrow={t("roadmap.eyebrow")} title={t("roadmap.title")}>
        <Steps columns={2} items={t.raw("roadmap.items") as Item[]} label={t("roadmap.stepLabel")} />
      </Section>
      <Section id="founder" eyebrow={t("founder.eyebrow")} title={t("founder.name")}>
        <div className="card flex flex-col gap-6 sm:flex-row sm:items-center">
          <div role="img" aria-label={t("founder.avatarAlt")} className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-navy-800 text-3xl font-extrabold text-cyan-300">MM</div>
          <div>
            <p className="font-semibold text-navy-500">{t("founder.role")}</p>
            <p className="mt-2 max-w-2xl leading-relaxed text-navy-700">{t("founder.text")}</p>
          </div>
        </div>
      </Section>
      <CtaBanner title={t("cta.title")} text={t("cta.text")} button={t("cta.button")} query="investor" />
    </>
  );
}
