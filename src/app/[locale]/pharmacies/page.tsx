import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/page-metadata";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CardGrid } from "@/components/ui/CardGrid";
import { Steps } from "@/components/ui/Steps";
import { CtaBanner } from "@/components/ui/CtaBanner";

type Item = { title: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "pharmacies");
}

export default async function PharmaciesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pharmacies");

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} text={t("hero.text")} />
      <Section id="benefits" eyebrow={t("benefits.eyebrow")} title={t("benefits.title")}>
        <CardGrid columns={4} items={t.raw("benefits.items") as Item[]} />
      </Section>
      <Section id="flow" tone="soft" eyebrow={t("flow.eyebrow")} title={t("flow.title")}>
        <Steps items={t.raw("flow.steps") as Item[]} />
      </Section>
      <CtaBanner title={t("cta.title")} text={t("cta.text")} button={t("cta.button")} query="pharmacist" />
    </>
  );
}
