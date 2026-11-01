import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";

export default function NotFound() {
  return (
    <Providers>
      <Header />
      <main id="contenu">
    <section className="container-x flex min-h-[80svh] flex-col items-center justify-center pt-28 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-fg">
        Page <span className="text-accent-text">introuvable</span>
      </h1>
      <p className="mt-4 max-w-md text-muted">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-8">
        <Button href="/">
          Retour à l&apos;accueil
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </section>
      </main>
      <Footer />
    </Providers>
  );
}
