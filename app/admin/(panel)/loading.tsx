export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Chargement…</span>
      <div className="h-8 w-64 rounded-md bg-white/10" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/5" />
      <div className="mt-8 h-64 rounded-xl border border-white/10 bg-[#111111]" />
    </div>
  );
}
