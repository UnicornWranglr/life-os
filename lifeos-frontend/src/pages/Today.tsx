import { DayHeader }            from '@/components/features/today/DayHeader';
import { MorningAnchorBanner }  from '@/components/features/today/MorningAnchorBanner';
import { FocusCard }            from '@/components/features/today/FocusCard';
import { HabitsCard }           from '@/components/features/today/HabitsCard';
import { LifeTasksCard }        from '@/components/features/today/LifeTasksCard';
import { RoutinesCard }         from '@/components/features/today/RoutinesCard';
import { MomentumCard }         from '@/components/features/today/MomentumCard';
import { EveningCloseBanner }   from '@/components/features/today/EveningCloseBanner';

export function Today() {
  return (
    <div className="page">
      <DayHeader />
      {/* Morning anchor — renders before FocusCard before 12:00 if wakeTime not logged */}
      <MorningAnchorBanner />
      <div className="flex flex-col gap-4">
        <FocusCard />
        <HabitsCard />
        <LifeTasksCard />
        <RoutinesCard />
        <MomentumCard />
      </div>
      {/* Evening close — renders after all cards after 18:00 if sleepTarget not logged */}
      <EveningCloseBanner />
    </div>
  );
}
