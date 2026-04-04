import { useVision } from '@/hooks/useVision';

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function dateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export function DayHeader() {
  const { data: vision } = useVision();

  return (
    <div className="mb-8">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">
        {greetingText()}
      </h1>
      <p className="text-sm text-muted mb-5">{dateLabel()}</p>

      {vision?.statement && (
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20
                        text-accent-light text-xs font-medium px-3 py-1.5 rounded-full max-w-full">
          <span className="flex-shrink-0">◎</span>
          <span className="truncate">{vision.statement}</span>
        </div>
      )}
    </div>
  );
}
