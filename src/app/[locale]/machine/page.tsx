import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/page-metadata";
import { MACHINE_DIMENSIONS_CM } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CardGrid } from "@/components/ui/CardGrid";
import { SafeImage } from "@/components/ui/SafeImage";
import { MachineViewer } from "@/components/machine/MachineViewer";

type Item = { title: string; text: string; tag?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "machine");
}

export default async function MachinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Machine");
  const tc = await getTranslations("Common");
  const alts = t.raw("gallery.alts") as string[];
  const { length, width, height } = MACHINE_DIMENSIONS_CM;
  const specs = [
    [t("specs.length"), length],
    [t("specs.width"), width],
    [t("specs.height"), height],
  ] as const;

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} text={t("hero.text")} />

      <section aria-label={t("viewer.label")} className="section">
        <div className="container-page"><MachineViewer /></div>
      </section>

      <Section id="detects" tone="soft" eyebrow={t("detects.eyebrow")} title={t("detects.title")} text={t("detects.text")}>
        <CardGrid items={t.raw("detects.items") as Item[]} />
      </Section>

      <Section id="gallery" eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} text={t("gallery.text")}>
        <ul className="grid gap-5 sm:grid-cols-2">
          {alts.map((alt, i) => (
            <li key={alt} className="overflow-hidden rounded-2xl shadow-soft">
              <SafeImage src={`/images/machine-${i + 1}.jpg`} alt={alt} placeholderLabel={tc("placeholderImage")} className="aspect-[4/3] w-full" />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="specs" tone="dark" eyebrow={t("specs.eyebrow")} title={t("specs.title")}>
        <dl className="grid gap-6 sm:grid-cols-3">
          {specs.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/15">
              <dt className="text-sm font-semibold uppercase tracking-widest text-cyan-300">{label}</dt>
              <dd className="mt-2 text-4xl font-extrabold">{value} <span className="text-xl font-semibold text-navy-200">{t("specs.unit")}</span></dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-navy-200">{t("specs.note")}</p>
      </Section>
    </>
  );
}
