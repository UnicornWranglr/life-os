// Insights — Phase 2 scaffold. Charts and data in Phase 7.

export function Insights() {
  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Insights</h1>
      <p className="text-sm text-muted mb-9">How you're spending your time</p>

      <div className="flex flex-col gap-4">
        {[
          { label: 'Focus allocation', sub: 'Actual vs budget per area' },
          { label: 'Habit completion', sub: 'Weekly completion rates' },
          { label: 'Routine patterns', sub: 'Cooking, work block, sleep' },
        ].map(({ label, sub }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className="text-xs text-muted mb-4">{sub}</p>
            <div className="h-24 bg-surface2 rounded-xl flex items-center justify-center">
              <p className="text-xs text-muted opacity-50">Chart — Phase 7</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
