import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ctaBanner } from "@/content/home";
import { images } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CtaBanner() {
  return (
    <section aria-labelledby="cta-title" className="bg-bg py-6 sm:py-10">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[28px] bg-black px-6 py-20 text-center text-white sm:px-12 sm:py-24">
          <Image src={images.cta.src} alt="" aria-hidden="true" fill quality={70} sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover opacity-45" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-accent/80 via-black/70 to-black/85" />
          <div className="relative mx-auto max-w-3xl">
            <Reveal as="p" className="eyebrow !text-white/80">
              {ctaBanner.eyebrow}
            </Reveal>
            <Reveal delay={0.1}>
              <h2 id="cta-title" className="mt-5 text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05]">
                {ctaBanner.title}
              </h2>
            </Reveal>
            <Reveal as="p" delay={0.2} className="mx-auto mt-5 max-w-xl text-white/80 sm:text-lg">
              {ctaBanner.text}
            </Reveal>
            <Reveal delay={0.3} className="mt-10 flex justify-center">
              <Button href="/#contact" size="lg" variant="light" className="bg-white text-black hover:text-white">
                {ctaBanner.cta}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
