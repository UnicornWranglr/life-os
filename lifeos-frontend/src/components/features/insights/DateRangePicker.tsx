// DateRangePicker — three preset range buttons.
// Returns { from, to } as YYYY-MM-DD strings.

import { localDateString } from '@/utils/dates';

export type RangeKey = 'week' | '4weeks' | '12weeks';

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'week',    label: 'This week' },
  { key: '4weeks',  label: '4 weeks' },
  { key: '12weeks', label: '12 weeks' },
];

export function rangeToFromTo(key: RangeKey): { from: string; to: string } {
  const today = new Date();
  const to    = localDateString(today);

  if (key === 'week') {
    const dow    = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
    return { from: localDateString(monday), to };
  }

  const days  = key === '4weeks' ? 27 : 83; // 4×7-1, 12×7-1
  const start = new Date(today);
  start.setDate(today.getDate() - days);
  return { from: localDateString(start), to };
}

interface DateRangePickerProps {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-2 bg-surface border border-border rounded-xl p-1">
      {RANGE_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors
            ${value === opt.key
              ? 'bg-surface2 text-primary'
              : 'text-muted hover:text-primary'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
