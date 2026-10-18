import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/page-metadata";

type Block = { title: string; lines: string[] };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildMetadata((await params).locale, "privacy");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <div className="container-page section max-w-3xl">
      <h1 className="h1 mb-6">{t("title")}</h1>
      <p className="lead mb-12">{t("intro")}</p>
      {(t.raw("sections") as Block[]).map((block) => (
        <section key={block.title} className="mb-10">
          <h2 className="mb-3 text-2xl font-bold">{block.title}</h2>
          {block.lines.map((line) => (
            <p key={line} className="mb-2 leading-relaxed text-navy-700">{line}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
