// Areas — Phase 2 scaffold. Full cockpit + project boards in Phase 4.

export function Areas() {
  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Areas</h1>
      <p className="text-sm text-muted mb-9">Your active focus areas</p>

      <div className="flex flex-col gap-3">
        {[
          { name: 'Trading',             color: '#4CAF50', pct: 35 },
          { name: 'Trading Journal App', color: '#2196F3', pct: 20 },
          { name: 'Life OS',             color: '#9C27B0', pct: 15 },
          { name: 'Peak Processing',     color: '#FF9800', pct: 20 },
          { name: 'Financial & Lifestyle', color: '#F44336', pct: 10 },
        ].map(area => (
          <div key={area.name}
               className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                 style={{ background: area.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{area.name}</p>
              <p className="text-xs text-muted mt-0.5">Target {area.pct}% of focus</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-muted flex-shrink-0"
                 fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted text-center opacity-50">
        Project boards and session logging in Phase 4
      </p>
    </div>
  );
}
