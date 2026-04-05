// AreaFormSheet — shared create / edit form for areas.
// Handles both modes from a single component; callers pass an optional
// area prop to enter edit mode (pre-fills all fields).

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { areasApi } from '@/api/areas';
import type { Area, AreaType } from '@/types';

const COLOR_PRESETS = [
  '#1D9E75', '#17A37A', '#378ADD', '#7F77DD',
  '#D85A30', '#BA7517', '#E24B4A', '#888888',
  '#C084FC', '#F472B6', '#34D399', '#60A5FA',
];

const AREA_TYPES: { value: AreaType; label: string }[] = [
  { value: 'income_building', label: 'Income building' },
  { value: 'project',         label: 'Project'         },
  { value: 'obligation',      label: 'Obligation'      },
  { value: 'vision',          label: 'Vision'          },
];

const inputCls =
  'w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm ' +
  'text-primary placeholder:text-muted/40 outline-none focus:border-accent transition-colors';

interface AreaFormSheetProps {
  open:    boolean;
  onClose: () => void;
  area?:   Area;
}

export function AreaFormSheet({ open, onClose, area }: AreaFormSheetProps) {
  const qc = useQueryClient();

  const [name,           setName]           = useState('');
  const [type,           setType]           = useState<AreaType>('project');
  const [focusBudgetPct, setFocusBudgetPct] = useState(10);
  const [color,          setColor]          = useState(COLOR_PRESETS[0]);
  const [weekdaysOnly,   setWeekdaysOnly]   = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => {
    if (!open) return;
    if (area) {
      setName(area.name);
      setType(area.type);
      setFocusBudgetPct(area.focusBudgetPct);
      setColor(area.color);
      setWeekdaysOnly(area.weekdaysOnly);
    } else {
      setName(''); setType('project'); setFocusBudgetPct(10);
      setColor(COLOR_PRESETS[0]); setWeekdaysOnly(false);
    }
    setError('');
  }, [open, area]);

  function handleClose() { setError(''); onClose(); }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: name.trim(), type, focusBudgetPct, color, weekdaysOnly };
      if (area) {
        await areasApi.update(area.id, payload);
      } else {
        await areasApi.create(payload);
      }
      qc.invalidateQueries({ queryKey: ['areas'] });
      handleClose();
    } catch {
      setError('Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!area;

  return (
    <BottomSheet open={open} onClose={handleClose} title={isEdit ? 'Edit area' : 'New area'}>
      <div className="flex flex-col gap-3">

        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="Area name"
          className={inputCls}
          autoFocus
        />

        <select
          value={type}
          onChange={e => setType(e.target.value as AreaType)}
          className={inputCls}
        >
          {AREA_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <label className="text-xs text-muted w-28 flex-shrink-0">Focus budget</label>
          <input
            type="number"
            min={0}
            max={100}
            value={focusBudgetPct}
            onChange={e => setFocusBudgetPct(Math.min(100, Math.max(0, Number(e.target.value))))}
            className={inputCls + ' text-right'}
          />
          <span className="text-sm text-muted flex-shrink-0">%</span>
        </div>

        <div>
          <p className="text-xs text-muted mb-2">Colour</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform active:scale-90"
                style={{
                  background:    c,
                  outline:       color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>

        <div
          onClick={() => setWeekdaysOnly(v => !v)}
          className="flex items-center gap-3 cursor-pointer py-1"
        >
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5
            ${weekdaysOnly ? 'bg-accent' : 'bg-surface2 border border-border'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-primary shadow transition-transform
              ${weekdaysOnly ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-primary">Weekdays only</span>
        </div>

        {error && <p className="text-xs text-red">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent text-white text-sm font-semibold rounded-xl py-3
                     transition-opacity disabled:opacity-50 mt-1"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add area'}
        </button>
      </div>
    </BottomSheet>
  );
}
