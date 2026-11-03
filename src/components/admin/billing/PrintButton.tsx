"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** Le titre de l'onglet devient le nom du fichier PDF proposé par le navigateur. */
export function PrintButton({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-[#2d66d2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A82EA]"
    >
      <Printer size={15} aria-hidden="true" />
      Imprimer / Enregistrer en PDF
    </button>
  );
}
