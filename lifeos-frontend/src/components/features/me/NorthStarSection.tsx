import { useState } from 'react';
import { useVision, useSaveVision } from '@/hooks/useVision';
import { inputCls, ActionBtn } from './SectionCard';

export function NorthStarSection() {
  const { data: vision, isLoading } = useVision();
  const save = useSaveVision();

  const [editing,   setEditing]   = useState(false);
  const [statement, setStatement] = useState('');
  const [error,     setError]     = useState('');

  function startEdit() {
    setStatement(vision?.statement ?? '');
    setEditing(true);
    setError('');
  }

  async function handleSave() {
    if (!statement.trim()) { setError('Cannot be empty'); return; }
    try {
      await save.mutateAsync(statement.trim());
      setEditing(false);
    } catch {
      setError('Failed to save');
    }
  }

  if (isLoading) return <div className="h-10 bg-surface2 rounded-xl animate-pulse" />;

  return (
    <div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={statement}
            onChange={e => { setStatement(e.target.value); setError(''); }}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Your long-term north star..."
            autoFocus
          />
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={save.isPending}
              className="flex-1 bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                         transition-opacity disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <ActionBtn onClick={() => setEditing(false)}>Cancel</ActionBtn>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-primary leading-relaxed flex-1">
            {vision?.statement ?? <span className="text-muted/50 italic">No north star set yet.</span>}
          </p>
          <ActionBtn onClick={startEdit}>Edit</ActionBtn>
        </div>
      )}
    </div>
  );
}
