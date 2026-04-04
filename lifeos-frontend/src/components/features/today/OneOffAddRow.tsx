import { useState, useRef } from 'react';

interface OneOffAddRowProps {
  onAdd: (note: string) => void;
  disabled?: boolean;
}

export function OneOffAddRow({ onAdd, disabled }: OneOffAddRowProps) {
  const [value, setValue]   = useState('');
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    setActive(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'Escape') { setValue(''); setActive(false); }
  }

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex items-center gap-2 py-2 text-sm text-muted w-full text-left
                   hover:text-primary transition-colors"
      >
        <span className="w-6 h-6 rounded-md border-2 border-dashed border-border flex items-center
                         justify-center text-base leading-none flex-shrink-0">+</span>
        Add a one-off task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-6 h-6 flex-shrink-0" /> {/* spacer aligns with task rows */}
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (!value.trim()) setActive(false); }}
        disabled={disabled}
        placeholder="What else needs doing today?"
        className="flex-1 bg-transparent text-sm text-primary placeholder-border outline-none
                   border-b border-border focus:border-accent transition-colors pb-1"
      />
      {value.trim() && (
        <button
          onClick={submit}
          disabled={disabled}
          className="text-xs font-semibold text-accent px-2 py-1"
        >
          Add
        </button>
      )}
    </div>
  );
}
