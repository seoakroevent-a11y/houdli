import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers/Providers";
import { PublicSettingsProvider } from "@/components/providers/PublicSettings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics";
import { VoiceAgent } from "@/components/layout/VoiceAgent";
import { Loader } from "@/components/layout/Loader";
import { getPublicSettings, getSeoSettings } from "@/lib/public-data";
import { jsonLdString, localBusinessJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  if (!seo) return {};
  return {
    description: seo.description || undefined,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    openGraph: {
      description: seo.description || undefined,
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630, alt: "Houdli" }] : undefined,
    },
  };
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <Providers>
      <PublicSettingsProvider value={settings}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(localBusinessJsonLd(settings)) }} />
        <a
          href="#contenu"
          className="sr-only z-[300] rounded-full bg-accent px-5 py-3 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Aller au contenu
        </a>
        <Loader />
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <FloatingActions />
        <VoiceAgent
          engine={
            process.env.NEXT_PUBLIC_LINA_ENGINE === "elevenlabs" && process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
              ? "elevenlabs"
              : process.env.GEMINI_API_KEY
                ? "browser"
                : null
          }
        />
        <GoogleAnalytics />
      </PublicSettingsProvider>
    </Providers>
  );
}
