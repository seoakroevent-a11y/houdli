"use client";

import { Trash2 } from "lucide-react";
import { dangerButton } from "./styles";

export function ConfirmSubmit({ label = "Supprimer cet élément ?" }: { label?: string }) {
  return (
    <button
      type="submit"
      className={dangerButton}
      onClick={(event) => {
        if (!window.confirm(label)) event.preventDefault();
      }}
    >
      <Trash2 size={13} aria-hidden="true" />
      Supprimer
    </button>
  );
}
