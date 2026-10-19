import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("siteName"), template: `%s | MDM` },
    description: t("defaultDescription"),
    openGraph: { siteName: "MDM", type: "website", locale: locale === "fr" ? "fr_FR" : "en_GB" },
  };
}

export const viewport = { themeColor: "#081a3b" };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("Common");

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lg">
            {t("skipToContent")}
          </a>
          <div className="bg-navy-950 px-4 py-1.5 text-center text-xs text-navy-100">{t("disclaimer")}</div>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
