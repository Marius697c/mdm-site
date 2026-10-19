import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/page-metadata";
import { Section } from "@/components/ui/Section";
import { Steps } from "@/components/ui/Steps";
import { CardGrid } from "@/components/ui/CardGrid";
import { MachineIllustration } from "@/components/ui/MachineIllustration";
import { PhoneMockup } from "@/components/mdiag/PhoneMockups";

type Item = { title: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "home");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 text-white">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="eyebrow !text-cyan-300">{t("hero.eyebrow")}</p>
            <h1 className="h1">{t("hero.title")}</h1>
            <p className="lead mt-6 !text-navy-100">{t("hero.text")}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href={{ pathname: "/contact", query: { profile: "investor" } }} className="btn-primary">{t("hero.investor")}</Link>
              <Link href={{ pathname: "/contact", query: { profile: "pharmacist" } }} className="btn-secondary">{t("hero.pharmacist")}</Link>
            </div>
          </div>
          <MachineIllustration alt={t("hero.visualAlt")} />
        </div>
      </section>

      <Section id="problem" eyebrow={t("problem.eyebrow")} title={t("problem.title")} text={t("problem.text")}>
        <CardGrid items={t.raw("problem.items") as Item[]} />
      </Section>

      <Section id="solution" tone="soft" eyebrow={t("solution.eyebrow")} title={t("solution.title")} text={t("solution.text")}>
        <Steps items={t.raw("solution.steps") as Item[]} label={t("solution.stepLabel")} />
      </Section>

      <Section id="preview" eyebrow={t("preview.eyebrow")} title={t("preview.title")}>
        <div className="grid gap-8 md:grid-cols-2">
          <article className="card flex flex-col">
            <div className="mb-6 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 p-6">
              <MachineIllustration alt="" />
            </div>
            <h3 className="text-2xl font-bold">{t("preview.machine.title")}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-navy-700">{t("preview.machine.text")}</p>
            <Link href="/machine" className="btn-dark mt-6 self-start">{tc("discoverMachine")}</Link>
          </article>
          <article className="card flex flex-col">
            <div className="mb-6 flex justify-center gap-4 rounded-xl bg-navy-50 p-6">
              <PhoneMockup kind="results" />
              <div className="hidden sm:block"><PhoneMockup kind="map" /></div>
            </div>
            <h3 className="text-2xl font-bold">{t("preview.app.title")}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-navy-700">{t("preview.app.text")}</p>
            <Link href="/mdiag" className="btn-dark mt-6 self-start">{tc("discoverApp")}</Link>
          </article>
        </div>
      </Section>
    </>
  );
}
