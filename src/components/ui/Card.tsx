import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "li";
};

export function Card({ children, className, interactive = false, as: Comp = "div" }: CardProps) {
  return (
    <Comp
      className={cn(
        "surface-card relative overflow-hidden p-6 sm:p-8",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-accent/30 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
