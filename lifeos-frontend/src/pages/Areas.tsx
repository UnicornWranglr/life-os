// Areas cockpit — list of all active areas with momentum, focus budget, and next action.

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { useAllProjectItems } from '@/hooks/useProjectItems';
import { getMomentum } from '@/utils/momentum';
import { AreaCockpitCard } from '@/components/features/areas/AreaCockpitCard';
import { RecentActivityCard } from '@/components/features/areas/RecentActivityCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { areasApi } from '@/api/areas';
import type { Area, AreaType, ProjectItem } from '@/types';

// ── Constants ──────────────────────────────────────────────────────────────

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

// ── AreaFormSheet — handles both create and edit ───────────────────────────

interface AreaFormSheetProps {
  open:    boolean;
  onClose: () => void;
  area?:   Area;          // when provided: edit mode
}

function AreaFormSheet({ open, onClose, area }: AreaFormSheetProps) {
  const qc = useQueryClient();

  const [name,           setName]           = useState('');
  const [type,           setType]           = useState<AreaType>('project');
  const [focusBudgetPct, setFocusBudgetPct] = useState(10);
  const [color,          setColor]          = useState(COLOR_PRESETS[0]);
  const [weekdaysOnly,   setWeekdaysOnly]   = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  // Sync form fields whenever the sheet opens or the target area changes.
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
                  background: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer py-1">
          <div
            onClick={() => setWeekdaysOnly(v => !v)}
            className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5
              ${weekdaysOnly ? 'bg-accent' : 'bg-surface2 border border-border'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-primary shadow transition-transform
              ${weekdaysOnly ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-primary">Weekdays only</span>
        </label>

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

// ── Areas page ─────────────────────────────────────────────────────────────

export function Areas() {
  const { data: areas    = [], isLoading: areasLoading    } = useAreas();
  const { data: sessions = [], isLoading: sessionsLoading } = useRecentSessions();
  const { data: items    = [], isLoading: itemsLoading    } = useAllProjectItems();
  const qc = useQueryClient();

  const [formOpen,     setFormOpen]     = useState(false);
  const [editingArea,  setEditingArea]  = useState<Area | undefined>(undefined);
  const [archiving,    setArchiving]    = useState<string | null>(null); // areaId being archived

  const isLoading = areasLoading || sessionsLoading || itemsLoading;
  const active    = areas.filter(a => a.status === 'active');

  const nextActionMap = new Map<string, ProjectItem>();
  for (const item of items) {
    if (item.type === 'action' && item.status === 'next' && !nextActionMap.has(item.areaId)) {
      nextActionMap.set(item.areaId, item);
    }
  }

  function openAdd()         { setEditingArea(undefined); setFormOpen(true); }
  function openEdit(a: Area) { setEditingArea(a);         setFormOpen(true); }

  async function handleArchive(id: string) {
    setArchiving(id);
    try {
      await areasApi.archive(id);
      qc.invalidateQueries({ queryKey: ['areas'] });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Areas</h1>
          <p className="text-sm text-muted">Your active focus areas</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-medium text-accent-light
                     bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full
                     active:opacity-70 transition-opacity mt-1"
        >
          <span className="text-base leading-none">+</span>
          Add area
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted text-center mt-16">No active areas configured.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(area => (
            <AreaCockpitCard
              key={area.id}
              area={area}
              momentum={getMomentum(area, sessions)}
              nextAction={nextActionMap.get(area.id)}
              onEdit={() => openEdit(area)}
              onArchive={archiving === area.id ? undefined : () => handleArchive(area.id)}
            />
          ))}
        </div>
      )}

      {areas.filter(a => a.status === 'paused').length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Paused</p>
          <div className="flex flex-col gap-2">
            {areas.filter(a => a.status === 'paused').map(area => (
              <div key={area.id}
                   className="bg-surface border border-border rounded-2xl px-4 py-3
                              flex items-center justify-between gap-2.5 opacity-60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                       style={{ background: area.color }} />
                  <p className="text-sm text-muted truncate">{area.name}</p>
                </div>
                <button
                  onClick={() => openEdit(area)}
                  className="text-xs text-muted active:opacity-70 flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <RecentActivityCard />
      </div>

      <AreaFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        area={editingArea}
      />
    </div>
  );
}
