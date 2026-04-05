import { useState } from 'react';
import { useCurrentRocks, useUpdateRock } from '@/hooks/useRocks';
import { useAreas } from '@/hooks/useAreas';
import { rocksApi } from '@/api/rocks';
import { useQueryClient } from '@tanstack/react-query';
import { currentQuarter } from '@/utils/dates';
import { inputCls, ActionBtn } from './SectionCard';
import type { RockStatus } from '@/types';

const STATUS_OPTS: { value: RockStatus; label: string; style: string }[] = [
  { value: 'on_track', label: 'On track', style: 'bg-green/10  text-green  border-green/20' },
  { value: 'at_risk',  label: 'At risk',  style: 'bg-amber/10  text-amber  border-amber/20' },
  { value: 'done',     label: 'Done',     style: 'bg-accent/10 text-accent-light border-accent/20' },
];

export function RocksSection() {
  const { data: rocks = [], isLoading } = useCurrentRocks();
  const { data: areas = [] }            = useAreas();
  const update = useUpdateRock();
  const qc     = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [title,   setTitle]   = useState('');
  const [areaId,  setAreaId]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const active = areas.filter(a => a.status === 'active');
  const quarter = currentQuarter();

  async function handleAdd() {
    if (!title.trim() || !areaId) { setError('Title and area are required'); return; }
    setSaving(true); setError('');
    try {
      await rocksApi.create?.({ areaId, quarter, title: title.trim() });
      qc.invalidateQueries({ queryKey: ['rocks'] });
      setTitle(''); setAreaId(''); setAddOpen(false);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{quarter}</p>

      {isLoading && <div className="h-10 bg-surface2 rounded-xl animate-pulse" />}

      {!isLoading && rocks.length === 0 && (
        <p className="text-xs text-muted/50">No rocks this quarter yet.</p>
      )}

      {rocks.map(rock => {
        const area = areas.find(a => a.id === rock.areaId);
        return (
          <div key={rock.id} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {area && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: area.color }} />
                  <span className="text-[10px] text-muted">{area.name}</span>
                </div>
              )}
              <p className="text-sm text-primary leading-snug">{rock.title}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {STATUS_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update.mutate({ id: rock.id, status: opt.value })}
                  className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors
                    ${rock.status === opt.value ? opt.style : 'bg-surface2 border-border text-muted'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {addOpen ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder="Rock title"
            className={inputCls}
            autoFocus
          />
          <select
            value={areaId}
            onChange={e => setAreaId(e.target.value)}
            className={inputCls}
          >
            <option value="">Select area…</option>
            {active.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                         transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add rock'}
            </button>
            <ActionBtn onClick={() => { setAddOpen(false); setError(''); }}>Cancel</ActionBtn>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 text-xs text-accent-light mt-1"
        >
          <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">+</span>
          Add rock
        </button>
      )}
    </div>
  );
}
