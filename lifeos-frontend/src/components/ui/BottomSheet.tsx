// BottomSheet — reusable modal that slides up from the bottom.
// Used by FocusCard (swap area, log session).

import { useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-app bg-surface border-t border-border rounded-t-2xl
                   px-5 pb-8 pt-4 animate-slide-up"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 w-10 h-1 rounded-full bg-border" />

        {title && (
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">
            {title}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
