import { useState } from 'react';
import { useCurrentIntentions, useAddIntention, useUpdateIntention, useDeleteIntention } from '@/hooks/useIntentions';
import { useAreas } from '@/hooks/useAreas';
import { inputCls, ActionBtn } from './SectionCard';
import type { IntentionStatus } from '@/types';

const STATUS_OPTS: { value: IntentionStatus; label: string; style: string }[] = [
  { value: 'active',  label: 'Active',  style: 'bg-accent/10 text-accent-light border-accent/20' },
  { value: 'done',    label: 'Done',    style: 'bg-green/10  text-green  border-green/20' },
  { value: 'dropped', label: 'Dropped', style: 'bg-surface2  text-muted  border-border' },
];

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function IntentionsSection() {
  const { data: intentions = [], isLoading } = useCurrentIntentions();
  const { data: areas      = [] }            = useAreas();
  const add    = useAddIntention();
  const update = useUpdateIntention();
  const remove = useDeleteIntention();

  const [addOpen, setAddOpen] = useState(false);
  const [title,   setTitle]   = useState('');
  const [areaId,  setAreaId]  = useState('');
  const [error,   setError]   = useState('');

  const active = areas.filter(a => a.status === 'active');

  async function handleAdd() {
    if (!title.trim() || !areaId) { setError('Title and area are required'); return; }
    setError('');
    try {
      await add.mutateAsync({ areaId, title: title.trim() });
      setTitle(''); setAreaId(''); setAddOpen(false);
    } catch {
      setError('Failed to save');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{currentMonthLabel()}</p>

      {isLoading && <div className="h-10 bg-surface2 rounded-xl animate-pulse" />}

      {!isLoading && intentions.length === 0 && (
        <p className="text-xs text-muted/50">No intentions this month yet.</p>
      )}

      {intentions.map(intention => {
        const area = areas.find(a => a.id === intention.areaId);
        return (
          <div key={intention.id} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {area && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: area.color }} />
                  <span className="text-[10px] text-muted">{area.name}</span>
                </div>
              )}
              <p className="text-sm text-primary leading-snug">{intention.title}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <select
                value={intention.status}
                onChange={e => update.mutate({ id: intention.id, status: e.target.value as IntentionStatus })}
                className="text-[10px] bg-surface2 border border-border rounded-lg px-2 py-1
                           text-muted outline-none focus:border-accent cursor-pointer"
              >
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => remove.mutate(intention.id)}
                className="w-5 h-5 flex items-center justify-center text-muted/40 hover:text-red
                           transition-colors rounded"
                aria-label="Delete intention"
              >
                <svg viewBox="0 0 14 14" className="w-3 h-3 stroke-current" fill="none"
                     strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {addOpen ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder="Intention title"
            className={inputCls}
            autoFocus
          />
          <select value={areaId} onChange={e => setAreaId(e.target.value)} className={inputCls}>
            <option value="">Select area…</option>
            {active.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={add.isPending}
              className="flex-1 bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                         transition-opacity disabled:opacity-50"
            >
              {add.isPending ? 'Saving…' : 'Add intention'}
            </button>
            <ActionBtn onClick={() => { setAddOpen(false); setError(''); }}>Cancel</ActionBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 text-xs text-accent-light mt-1">
          <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">+</span>
          Add intention
        </button>
      )}
    </div>
  );
}
