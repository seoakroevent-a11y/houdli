export const LINA_RETENTION_DAYS = 90;
export const LINA_AUDIO_BUCKET = "lina-audio";
export const LINA_AUDIO_MAX_BYTES = 3 * 1024 * 1024;

export type TranscriptRole = "client" | "lina" | "action";

/** `at` : secondes écoulées depuis le début de l'appel. */
export type TranscriptEntry = { role: TranscriptRole; text: string; at: number };
