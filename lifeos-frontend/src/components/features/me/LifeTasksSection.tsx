import { useState } from 'react';
import { useAllLifeTasks, useAddLifeTask, useToggleLifeTask } from '@/hooks/useLifeTasks';
import { inputCls, ActionBtn } from './SectionCard';
import type { ScheduleType, TaskScope } from '@/types';

const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: 'daily',              label: 'Daily' },
  { value: 'days_of_week',       label: 'Days of week' },
  { value: 'weekly_floating',    label: 'Weekly (any day)' },
  { value: 'every_n_weeks',      label: 'Every N weeks' },
  { value: 'monthly_date',       label: 'Monthly (date)' },
  { value: 'monthly_occurrence', label: 'Monthly (occurrence)' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function scheduleLabel(task: { scheduleType: ScheduleType; scheduleConfig: Record<string, unknown> }): string {
  const cfg = task.scheduleConfig;
  switch (task.scheduleType) {
    case 'daily':              return 'Daily';
    case 'weekly_floating':    return 'Weekly (any day)';
    case 'days_of_week':       return ((cfg.days as string[]) ?? []).map(d => d.slice(0, 3)).join(' · ');
    case 'every_n_weeks':      return `Every ${cfg.every}w`;
    case 'monthly_date':       return `Monthly (${cfg.date}th)`;
    case 'monthly_occurrence': return `${cfg.occurrence} ${cfg.day} of month`;
    default:                   return task.scheduleType;
  }
}

export function LifeTasksSection() {
  const { data: tasks = [], isLoading } = useAllLifeTasks();
  const addTask    = useAddLifeTask();
  const toggleTask = useToggleLifeTask();

  const [addOpen,   setAddOpen]   = useState(false);
  const [name,      setName]      = useState('');
  const [category,  setCategory]  = useState('');
  const [scope,     setScope]     = useState<TaskScope>('daily');
  const [schedType, setSchedType] = useState<ScheduleType>('daily');
  const [dowDays,   setDowDays]   = useState<string[]>([]);
  const [everyN,    setEveryN]    = useState('2');
  const [monthDate, setMonthDate] = useState('1');
  const [error,     setError]     = useState('');

  function buildConfig(): Record<string, unknown> {
    switch (schedType) {
      case 'days_of_week':       return { days: dowDays };
      case 'every_n_weeks':      return { every: Number(everyN) };
      case 'monthly_date':       return { date: Number(monthDate) };
      case 'monthly_occurrence': return { occurrence: 'first', day: 'monday' };
      default:                   return {};
    }
  }

  async function handleAdd() {
    if (!name.trim()) { setError('Name is required'); return; }
    if (schedType === 'days_of_week' && dowDays.length === 0) {
      setError('Select at least one day'); return;
    }
    setError('');
    try {
      await addTask.mutateAsync({
        name: name.trim(),
        category: category.trim() || null,
        scheduleType: schedType,
        scheduleConfig: buildConfig(),
        scope,
      });
      setName(''); setCategory(''); setScope('daily'); setSchedType('daily');
      setDowDays([]); setEveryN('2'); setMonthDate('1'); setAddOpen(false);
    } catch {
      setError('Failed to save');
    }
  }

  function toggleDay(day: string) {
    setDowDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  return (
    <div className="flex flex-col gap-2">
      {isLoading && <div className="h-10 bg-surface2 rounded-xl animate-pulse" />}

      {!isLoading && tasks.length === 0 && (
        <p className="text-xs text-muted/50">No life tasks configured yet.</p>
      )}

      {tasks.map(task => (
        <div key={task.id} className="flex items-center gap-3 py-1.5">
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-tight ${task.active ? 'text-primary' : 'text-muted line-through'}`}>
              {task.name}
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {scheduleLabel(task)}
              {task.category ? ` · ${task.category}` : ''}
            </p>
          </div>
          <button
            onClick={() => toggleTask.mutate({ id: task.id, active: !task.active })}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
              task.active ? 'bg-accent' : 'bg-surface2 border border-border'
            }`}
            aria-label={task.active ? 'Deactivate' : 'Activate'}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
              task.active ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>
      ))}

      {addOpen ? (
        <div className="flex flex-col gap-2.5 pt-3 mt-1 border-t border-border/60">
          <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
                 placeholder="Task name" className={inputCls} autoFocus />
          <input value={category} onChange={e => setCategory(e.target.value)}
                 placeholder="Category (optional)" className={inputCls} />

          <div>
            <p className="text-xs text-muted mb-1.5">Schedule</p>
            <select value={schedType} onChange={e => setSchedType(e.target.value as ScheduleType)}
                    className={inputCls}>
              {SCHEDULE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {schedType === 'days_of_week' && (
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => toggleDay(DAY_VALUES[i])}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors
                          ${dowDays.includes(DAY_VALUES[i])
                            ? 'bg-accent/15 border-accent/40 text-accent-light'
                            : 'bg-surface2 border-border text-muted'}`}>{d}</button>
              ))}
            </div>
          )}

          {schedType === 'every_n_weeks' && (
            <input type="number" min={1} max={52} value={everyN}
                   onChange={e => setEveryN(e.target.value)}
                   placeholder="Every N weeks" className={inputCls} />
          )}

          {schedType === 'monthly_date' && (
            <input type="number" min={1} max={28} value={monthDate}
                   onChange={e => setMonthDate(e.target.value)}
                   placeholder="Day of month (1-28)" className={inputCls} />
          )}

          <div>
            <p className="text-xs text-muted mb-1.5">Scope</p>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'oneoff'] as TaskScope[]).map(s => (
                <button key={s} onClick={() => setScope(s)}
                        className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors capitalize
                          ${scope === s
                            ? 'bg-accent/15 border-accent/40 text-accent-light'
                            : 'bg-surface2 border-border text-muted'}`}>{s}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={addTask.isPending}
                    className="flex-1 bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                               transition-opacity disabled:opacity-50">
              {addTask.isPending ? 'Saving…' : 'Add task'}
            </button>
            <ActionBtn onClick={() => { setAddOpen(false); setError(''); }}>Cancel</ActionBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 text-xs text-accent-light mt-1">
          <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">+</span>
          Add task
        </button>
      )}
    </div>
  );
}
