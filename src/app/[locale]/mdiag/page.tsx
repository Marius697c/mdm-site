import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/page-metadata";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CardGrid } from "@/components/ui/CardGrid";
import { PhoneMockup, type MockupKind } from "@/components/mdiag/PhoneMockups";

type Item = { title: string; text: string };

const KINDS: MockupKind[] = ["results", "history", "map", "prescription", "signup"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "mdiag");
}

export default async function MdiagPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Mdiag");
  const tc = await getTranslations("Common");
  const features = t.raw("features.items") as Item[];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} text={t("hero.text")} />

      <section className="section">
        <div className="container-page">
          <CardGrid
            columns={2}
            items={[
              { title: t("modes.withMachine.title"), text: t("modes.withMachine.text") },
              { title: t("modes.standalone.title"), text: t("modes.standalone.text") },
            ]}
          />
        </div>
      </section>

      <Section id="features" tone="soft" eyebrow={t("features.eyebrow")} title={t("features.title")}>
        <ul className="space-y-16">
          {features.map((feature, i) => (
            <li key={feature.title} className="grid items-center gap-10 md:grid-cols-2">
              <div className={i % 2 ? "md:order-2" : ""}>
                <h3 className="text-2xl font-bold sm:text-3xl">{feature.title}</h3>
                <p className="lead mt-3">{feature.text}</p>
              </div>
              <figure className={i % 2 ? "md:order-1" : ""}>
                <PhoneMockup kind={KINDS[i]} />
                <figcaption className="mt-3 text-center text-sm text-navy-700">{tc("mockupCaption")}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="security" tone="dark" eyebrow={t("security.eyebrow")} title={t("security.title")} text={t("security.text")}>
        <ul className="grid gap-4 md:grid-cols-3">
          {(t.raw("security.points") as string[]).map((point) => (
            <li key={point} className="flex gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/15">
              <span aria-hidden="true" className="text-cyan-300">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
