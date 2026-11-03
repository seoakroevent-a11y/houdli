/** Permet à l'agent vocal de remplir et d'envoyer le formulaire de contact monté sur la page. */
export type ContactDraft = Partial<Record<"name" | "company" | "email" | "phone" | "service" | "message", string>>;

export type ContactBridge = {
  /** Remplit les champs fournis et renvoie les erreurs de validation par champ. */
  fill: (draft: ContactDraft) => Promise<Record<string, string>>;
  /** Envoie la demande ; renvoie `null` si elle est partie, sinon le message d'erreur. */
  submit: () => Promise<string | null>;
};

let current: ContactBridge | null = null;

export function registerContactBridge(bridge: ContactBridge) {
  current = bridge;
  return () => {
    if (current === bridge) current = null;
  };
}

export function contactBridge() {
  return current;
}
