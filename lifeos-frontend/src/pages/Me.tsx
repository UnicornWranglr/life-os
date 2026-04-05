import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '@/components/features/me/SectionCard';
import { NorthStarSection }    from '@/components/features/me/NorthStarSection';
import { RocksSection }        from '@/components/features/me/RocksSection';
import { IntentionsSection }   from '@/components/features/me/IntentionsSection';
import { HabitsConfigSection } from '@/components/features/me/HabitsConfigSection';
import { LifeTasksSection }    from '@/components/features/me/LifeTasksSection';
import { AccountSection }      from '@/components/features/me/AccountSection';

export function Me() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Me</h1>
      <p className="text-sm text-muted mb-6">{user?.email}</p>

      <div className="flex flex-col gap-3">
        <SectionCard title="North star" defaultOpen>
          <NorthStarSection />
        </SectionCard>

        <SectionCard title="Quarterly rocks">
          <RocksSection />
        </SectionCard>

        <SectionCard title="Monthly intentions">
          <IntentionsSection />
        </SectionCard>

        <SectionCard title="Habits">
          <HabitsConfigSection />
        </SectionCard>

        <SectionCard title="Life tasks">
          <LifeTasksSection />
        </SectionCard>

        <SectionCard title="Account settings">
          <AccountSection />
        </SectionCard>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full bg-surface border border-border rounded-2xl py-4 text-sm text-muted
                   font-medium transition-opacity active:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
