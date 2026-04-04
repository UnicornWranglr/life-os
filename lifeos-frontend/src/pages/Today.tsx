// Today — Phase 2 scaffold.
// Full implementation in Phase 3. Structure is already in place so Phase 3
// can drop components in without restructuring this file.

import { useAuth } from '@/contexts/AuthContext';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function dateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// Placeholder card — reused across all sections while real components are built
function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">{label}</p>
      <div className="h-10 bg-surface2 rounded-lg animate-pulse" />
    </div>
  );
}

export function Today() {
  const { user } = useAuth();

  return (
    <div className="page">
      {/* Greeting */}
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">
        {greeting()}
      </h1>
      <p className="text-sm text-muted mb-9">{dateLabel()}</p>

      {/* North star pill — Phase 3 */}
      <div className="mb-8 inline-flex items-center gap-2 bg-accent/10 border border-accent/20
                      text-accent text-xs font-medium px-3 py-1.5 rounded-full">
        <span>◎</span>
        <span>Full-time digital nomad swing trader by Q2 2028</span>
      </div>

      <div className="flex flex-col gap-4">
        <PlaceholderCard label="Focus" />
        <PlaceholderCard label="Habits" />
        <PlaceholderCard label="Life tasks" />
        <PlaceholderCard label="Routines" />
        <PlaceholderCard label="Momentum" />
      </div>

      {/* Debug: show current user until real content is built */}
      <p className="mt-8 text-xs text-muted text-center opacity-40">{user?.email}</p>
    </div>
  );
}
