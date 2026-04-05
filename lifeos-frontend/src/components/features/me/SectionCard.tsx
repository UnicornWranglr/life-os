// Shared collapsible section card for Me page.

import { useState } from 'react';

interface SectionCardProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionCard({ title, defaultOpen = false, children }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <p className="text-sm font-semibold text-primary">{title}</p>
        <svg
          viewBox="0 0 16 16"
          className={`w-4 h-4 stroke-muted flex-shrink-0 transition-transform duration-200
                      ${open ? 'rotate-180' : ''}`}
          fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Shared input style
export const inputCls =
  'w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm ' +
  'text-primary placeholder:text-muted/40 outline-none focus:border-accent transition-colors';

// Shared small action button
export function ActionBtn({
  onClick, disabled, children, variant = 'default',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-40
        ${variant === 'danger'
          ? 'bg-red/10 border-red/20 text-red active:opacity-70'
          : 'bg-surface2 border-border text-muted hover:text-primary active:opacity-70'}`}
    >
      {children}
    </button>
  );
}
