import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "base" | "alt";
  containerClassName?: string;
  labelledBy?: string;
};

export function Section({ id, children, className, tone = "base", containerClassName, labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative overflow-x-clip py-20 sm:py-24 lg:py-32",
        tone === "alt" ? "bg-bg-alt" : "bg-bg",
        className,
      )}
    >
      <div className={cn("container-x relative", containerClassName)}>{children}</div>
    </section>
  );
}
