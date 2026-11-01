"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** L'année est lue côté client : la page reste prérendue sans figer la date. */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => String(new Date().getFullYear()),
    () => "",
  );
  return <span>{year}</span>;
}
