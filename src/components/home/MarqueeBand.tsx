import { marqueeItems } from "@/content/home";
import { Marquee } from "@/components/ui/Marquee";

export function MarqueeBand() {
  return (
    <div id="marquee" className="border-y border-line bg-bg-alt py-6 sm:py-8">
      <Marquee duration={45} label="Points forts de Houdli">
        {marqueeItems.map((item) => (
          <span key={item} className="flex items-center">
            <span className="whitespace-nowrap px-6 font-display text-xl font-semibold tracking-tight text-fg sm:px-10 sm:text-3xl">
              {item}
            </span>
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
