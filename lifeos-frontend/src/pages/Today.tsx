import { DayHeader }      from '@/components/features/today/DayHeader';
import { FocusCard }      from '@/components/features/today/FocusCard';
import { HabitsCard }     from '@/components/features/today/HabitsCard';
import { LifeTasksCard }  from '@/components/features/today/LifeTasksCard';
import { RoutinesCard }   from '@/components/features/today/RoutinesCard';
import { MomentumCard }   from '@/components/features/today/MomentumCard';

export function Today() {
  return (
    <div className="page">
      <DayHeader />
      <div className="flex flex-col gap-4">
        <FocusCard />
        <HabitsCard />
        <LifeTasksCard />
        <RoutinesCard />
        <MomentumCard />
      </div>
    </div>
  );
}
