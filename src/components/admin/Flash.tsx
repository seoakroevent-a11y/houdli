export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) {
    return <p className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>;
  }
  if (ok) {
    return <p className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Enregistrement effectué.</p>;
  }
  return null;
}
