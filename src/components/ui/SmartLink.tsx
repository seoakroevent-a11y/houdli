"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

type SmartLinkProps = ComponentProps<typeof Link> & { href: string };

/** Lien interne qui défile en douceur vers les ancres de la page courante. */
export function SmartLink({ href, onClick: onAnchorClick, ...props }: SmartLinkProps) {
  const pathname = usePathname();
  const { scrollTo } = useSmoothScroll();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onAnchorClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;

    const [path, hash] = href.split("#");
    const samePage = (path || "/") === pathname;
    if (samePage && hash) {
      e.preventDefault();
      scrollTo(`#${hash}`);
      window.history.replaceState(null, "", `#${hash}`);
    } else if (samePage && href === pathname) {
      e.preventDefault();
      scrollTo(0);
      window.history.replaceState(null, "", pathname);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
