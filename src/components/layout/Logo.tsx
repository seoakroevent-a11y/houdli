import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  height?: number;
  /** Force la version blanche (ex. par-dessus une photo sombre). */
  tone?: "auto" | "light";
  /** Chargement immédiat (logo au-dessus de la ligne de flottaison). */
  eager?: boolean;
};

const RATIO = 950 / 640;

export function Logo({ className, height = 48, tone = "auto", eager = false }: LogoProps) {
  const width = Math.round(height * RATIO);
  const common = { width, height, unoptimized: true, loading: eager ? ("eager" as const) : undefined };
  const alt = "Houd-Li — De l'idée à l'impact";

  if (tone === "light") {
    return <Image src="/logo/houdli-white.svg" alt={alt} className={className} {...common} />;
  }

  return (
    <span className={cn("relative inline-block", className)} style={{ width, height }}>
      <Image src="/logo/houdli-black.svg" alt={alt} className="block dark:hidden" {...common} />
      <Image src="/logo/houdli-white.svg" alt="" aria-hidden className="hidden dark:block" {...common} />
    </span>
  );
}

/** Monogramme « H » du logo, en SVG inline pour pouvoir l'animer. */
export const markPaths = {
  arc: "M957.97,166.01v67.82c2.47-.15,6.07-.26,10.4,0,29.46,1.8,50.13,18.54,58.42,25.25,25.85,20.93,37.05,47.68,41.58,61.88,14.82,46.37-.51,86.61-6.93,103.47-8.75,22.96-20.54,39.83-29.21,50.5,5.62-2.63,13.78-6.9,22.77-13.37,32.85-23.62,46.54-54.84,50.99-65.35,9.65-22.77,11.76-42.41,12.38-51.16.65-9.28,2.26-43.96-16.34-82.5-3.81-7.9-24.97-50.16-74.75-76.83-19.8-10.6-38.45-15.7-52.66-18.24-5.5-.98-11.06-1.47-16.65-1.47h0Z",
  h: "M884.7,185.81l-45.67,41.21v255.08l45.67-40.1v-35.94c0-10.33,4.88-20.05,13.16-26.23l52.56-39.2v163.74l42.33-10.64v-185.4l-34.53-15.59-73.52,48.02s0-159.41,0-154.95Z",
  dot: { cx: 1129.75, cy: 181.36, r: 31.19 },
  viewBox: "820 140 360 360",
};
