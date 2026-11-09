import { references } from "@/content/home";
import { clientLogos, type ClientLogo } from "@/content/clients";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Marquee } from "@/components/ui/Marquee";

export function References({ logos = clientLogos }: { logos?: ClientLogo[] }) {
  return (
    <Section id="references" labelledBy="references-title" className="scroll-mt-24 py-14 sm:py-16 lg:py-20">
      <SectionHeading
        id="references-title"
        eyebrow={references.eyebrow}
        title={references.title}
        accent="Références"
        text={references.text}
        align="center"
      />
      <div className="relative left-1/2 mt-8 w-screen max-w-[100vw] -translate-x-1/2 sm:mt-10">
        <Marquee
          duration={55}
          label="Logos des références Houd-Li"
          className="motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
        >
          {logos.map((client) => (
            <div
              key={client.logo}
              className="mx-2.5 flex h-24 w-52 items-center justify-center rounded-md bg-white px-5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.45)] sm:mx-3 sm:h-28 sm:w-60"
            >
              <img
                src={client.logo}
                alt={client.name}
                width={280}
                height={112}
                loading="lazy"
                decoding="async"
                className="h-14 w-auto max-w-full object-contain sm:h-16"
              />
            </div>
          ))}
        </Marquee>
      </div>
    </Section>
  );
}
