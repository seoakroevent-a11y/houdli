import type { Transition, Variants } from "framer-motion";

/** Courbes et durées partagées par toutes les animations du site. */
export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  expo: [0.16, 1, 0.3, 1] as const,
};

export const duration = {
  base: 0.6,
  slow: 0.9,
};

export const gsapEase = {
  out: "power3.out",
  expo: "expo.out",
};

export const revealDistance = 24;

/**
 * Une clé `delay` explicite dans la transition d'un enfant écrase le décalage
 * calculé par le `staggerChildren` du parent : on ne la pose que si elle est fournie.
 */
const withDelay = (t: Transition, delay?: number): Transition =>
  delay === undefined ? t : { ...t, delay };

/** Passez un délai (en secondes) via la prop `custom` de l'élément animé. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: revealDistance },
  visible: (delay: number | undefined) => {
    const transition = withDelay({ duration: duration.base, ease: ease.out }, delay);
    return { opacity: 1, y: 0, transition };
  },
};

export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Mot qui sort d'un masque en glissant vers le haut (titre du hero). */
export const wordReveal: Variants = {
  hidden: { y: "110%" },
  visible: (delay: number | undefined) => ({
    y: "0%",
    transition: withDelay({ duration: duration.slow, ease: ease.expo }, delay ?? undefined),
  }),
};

/** Lettre qui bascule hors d'un masque (titre cinétique du hero). */
export const charReveal: Variants = {
  hidden: { y: "105%", rotate: 12, opacity: 0 },
  visible: (delay: number | undefined) => ({
    y: "0%",
    rotate: 0,
    opacity: 1,
    transition: withDelay(Object.assign({ duration: 1.1, ease: ease.expo }), delay),
  }),
};

export const pageTransition: { variants: Variants; transition: Transition } = {
  variants: {
    initial: { opacity: 0, y: 12 },
    enter: { opacity: 1, y: 0 },
  },
  transition: { duration: 0.5, ease: ease.out },
};

export const viewportOnce = { once: true, margin: "-80px 0px" } as const;
