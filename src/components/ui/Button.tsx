"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { SmartLink } from "./SmartLink";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "light";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  size?: "md" | "lg";
  className?: string;
  disabled?: boolean;
  magnetic?: boolean;
  external?: boolean;
  ariaLabel?: string;
};

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-display font-semibold tracking-tight transition-[color,border-color,box-shadow] duration-300 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, { root: string; fill: string }> = {
  primary: {
    root: "bg-accent text-white shadow-[0_10px_30px_-10px_rgba(45,102,210,0.7)]",
    fill: "bg-accent-hover",
  },
  outline: {
    root: "border border-line text-fg hover:border-accent hover:text-white",
    fill: "bg-accent",
  },
  light: {
    root: "border border-white/30 text-white hover:border-accent",
    fill: "bg-accent",
  },
};

const sizes = {
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.95rem] min-h-[52px]",
};

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  onClick: onPress,
  magnetic = true,
  external,
  ariaLabel,
}: ButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const shiftMagneticButton = (e: PointerEvent<HTMLDivElement>) => {
    if (!magnetic || reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const v = variants[variant];
  const classes = cn(base, v.root, sizes[size], className);
  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 origin-bottom scale-y-0 rounded-[inherit] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:scale-y-100",
          v.fill,
        )}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  return (
    <motion.div
      ref={ref}
      className="inline-flex"
      style={{ x: sx, y: sy }}
      onPointerMove={shiftMagneticButton}
      onPointerLeave={onLeave}
    >
      {href ? (
        external ? (
          <a href={href} className={classes} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} data-cursor="hover">
            {inner}
          </a>
        ) : (
          <SmartLink href={href} className={classes} aria-label={ariaLabel} data-cursor="hover">
            {inner}
          </SmartLink>
        )
      ) : (
        <button type={type} onClick={onPress} className={classes} disabled={disabled} aria-label={ariaLabel} data-cursor="hover">
          {inner}
        </button>
      )}
    </motion.div>
  );
}
