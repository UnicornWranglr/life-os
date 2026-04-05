// AddItemSheet — bottom sheet to add a new project item to an area.
// Pre-selects type/status based on which board section the + was tapped from.

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAddProjectItem } from '@/hooks/useProjectItems';
import type { ProjectItemStatus, ProjectItemType } from '@/types';

interface AddItemSheetProps {
  areaId: string;
  open: boolean;
  onClose: () => void;
  defaultType?: ProjectItemType;
  defaultStatus?: ProjectItemStatus;
}

const TYPE_OPTIONS: { value: ProjectItemType; label: string }[] = [
  { value: 'action',   label: 'Action' },
  { value: 'decision', label: 'Decision' },
  { value: 'note',     label: 'Note' },
];

export function AddItemSheet({
  areaId,
  open,
  onClose,
  defaultType   = 'action',
  defaultStatus = 'next',
}: AddItemSheetProps) {
  const add = useAddProjectItem();

  const [title,  setTitle]  = useState('');
  const [type,   setType]   = useState<ProjectItemType>(defaultType);
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');

  function reset() {
    setTitle('');
    setType(defaultType);
    setNotes('');
    setError('');
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    try {
      await add.mutateAsync({
        areaId,
        title: title.trim(),
        type,
        status: defaultStatus,
        notes: notes.trim() || undefined,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setError(msg ?? 'Failed to save. Try again.');
    }
  }

  // Reset type/status defaults when sheet opens with new defaults
  function handleOpen() {
    setType(defaultType);
  }

  return (
    <BottomSheet open={open} onClose={() => { reset(); onClose(); }} title="Add item">
      <div className="flex flex-col gap-4" onFocus={handleOpen}>
        {/* Type selector */}
        <div>
          <p className="text-xs text-muted mb-2">Type</p>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors
                  ${type === opt.value
                    ? 'bg-accent/15 border-accent/40 text-accent-light'
                    : 'bg-surface2 border-border text-muted'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs text-muted mb-1.5">
            {type === 'action'   ? 'What needs to be done?' :
             type === 'decision' ? 'What needs to be decided?' :
                                   'Note title'}
          </p>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder={
              type === 'action'   ? 'e.g. Review weekly targets' :
              type === 'decision' ? 'e.g. Switch broker platform?' :
                                    'e.g. Key resources'
            }
            autoFocus
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                       text-primary placeholder:text-muted/40 outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Optional notes */}
        <div>
          <p className="text-xs text-muted mb-1.5">Notes <span className="opacity-50">(optional)</span></p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any extra context..."
            rows={2}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                       text-primary placeholder:text-muted/40 outline-none focus:border-accent
                       transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red -mt-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={add.isPending}
          className="w-full bg-accent text-white font-semibold text-sm rounded-xl py-4
                     transition-opacity disabled:opacity-50"
        >
          {add.isPending ? 'Saving…' : 'Add item'}
        </button>
      </div>
    </BottomSheet>
  );
}
