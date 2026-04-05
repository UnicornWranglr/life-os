import { useState } from 'react';
import { useHabits, useAddHabit, useUpdateHabit } from '@/hooks/useHabits';
import { useAreas } from '@/hooks/useAreas';
import { inputCls, ActionBtn } from './SectionCard';

export function HabitsConfigSection() {
  const { data: habits = [], isLoading } = useHabits();
  const { data: areas  = [] }            = useAreas();
  const addHabit    = useAddHabit();
  const updateHabit = useUpdateHabit();

  const [addOpen, setAddOpen] = useState(false);
  const [name,    setName]    = useState('');
  const [areaId,  setAreaId]  = useState('');
  const [error,   setError]   = useState('');

  const active = areas.filter(a => a.status === 'active');

  async function handleAdd() {
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    try {
      await addHabit.mutateAsync({ name: name.trim(), areaId: areaId || undefined });
      setName(''); setAreaId(''); setAddOpen(false);
    } catch {
      setError('Failed to save');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {isLoading && <div className="h-10 bg-surface2 rounded-xl animate-pulse" />}

      {!isLoading && habits.length === 0 && (
        <p className="text-xs text-muted/50">No habits configured yet.</p>
      )}

      {habits.map(habit => {
        const area = areas.find(a => a.id === habit.areaId);
        return (
          <div key={habit.id} className="flex items-center gap-3 py-1.5">
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-tight ${habit.active ? 'text-primary' : 'text-muted line-through'}`}>
                {habit.name}
              </p>
              {area && (
                <p className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: area.color }} />
                  {area.name}
                </p>
              )}
            </div>
            <button
              onClick={() => updateHabit.mutate({ id: habit.id, active: !habit.active })}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                habit.active ? 'bg-accent' : 'bg-surface2 border border-border'
              }`}
              aria-label={habit.active ? 'Deactivate' : 'Activate'}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                habit.active ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>
        );
      })}

      {addOpen ? (
        <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border/60">
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="Habit name"
            className={inputCls}
            autoFocus
          />
          <select value={areaId} onChange={e => setAreaId(e.target.value)} className={inputCls}>
            <option value="">No area link</option>
            {active.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addHabit.isPending}
              className="flex-1 bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                         transition-opacity disabled:opacity-50"
            >
              {addHabit.isPending ? 'Saving…' : 'Add habit'}
            </button>
            <ActionBtn onClick={() => { setAddOpen(false); setError(''); }}>Cancel</ActionBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 text-xs text-accent-light mt-1">
          <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">+</span>
          Add habit
        </button>
      )}
    </div>
  );
}
