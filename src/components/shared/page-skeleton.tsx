export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando página">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-orbital-surface" />
        <div className="h-4 w-72 rounded bg-orbital-surface/60" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card h-28 rounded-xl bg-orbital-surface/40" />
        ))}
      </div>

      <div className="glass-card h-64 rounded-xl bg-orbital-surface/30" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-orbital-surface/40" />
        ))}
      </div>
    </div>
  );
}
