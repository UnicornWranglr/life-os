// Review — Phase 2 scaffold. Full weekly review form in Phase 6.

function getMondayLabel(): string {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function Review() {
  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Review</h1>
      <p className="text-sm text-muted mb-9">Week of {getMondayLabel()}</p>

      <div className="flex flex-col gap-4">
        {[
          'Area momentum',
          'Focus allocation',
          'Routine pattern',
          'Wins this week',
          'What got in the way',
          "Next week's priority area",
          'Rock progress',
        ].map(section => (
          <div key={section} className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">{section}</p>
            <div className="h-8 bg-surface2 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted text-center opacity-50">
        Full review form in Phase 6
      </p>
    </div>
  );
}
