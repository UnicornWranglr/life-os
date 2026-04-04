// Momentum calculation — per PRD section 6.6.
// Computed on the frontend from session data; not stored in the DB.

import type { Area, Session, AreaMomentum, MomentumLevel } from '@/types';
import { todayString, daysAgo } from './dates';

// Returns true if `dateStr` falls on a weekend (Sat/Sun).
function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr + 'T12:00').getDay();
  return dow === 0 || dow === 6;
}

export function getMomentum(
  area: Area,
  sessions: Session[],
): AreaMomentum {
  const today = todayString();

  // For weekdays-only areas, don't decay momentum over weekends.
  const effectiveToday = (() => {
    if (!area.weekdaysOnly || !isWeekend(today)) return today;
    // Step back to the most recent Friday
    const d = new Date(today + 'T12:00');
    while (isWeekend(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // Find the most recent session for this area
  const areaSessions = sessions
    .filter(s => s.areaId === area.id)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  if (areaSessions.length === 0) {
    return {
      areaId: area.id,
      daysSinceLastSession: null,
      level: 'red',
      label: 'No sessions yet',
    };
  }

  const lastSession  = areaSessions[0];
  const days         = daysAgo(lastSession.sessionDate);

  // For weekdays-only areas, compute effective gap excluding weekends
  let effectiveDays = days;
  if (area.weekdaysOnly) {
    let gap = 0;
    const last = new Date(lastSession.sessionDate + 'T12:00');
    const end  = new Date(effectiveToday + 'T12:00');
    const cursor = new Date(last.getTime());
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= end) {
      if (!isWeekend(cursor.toISOString().slice(0, 10))) gap++;
      cursor.setDate(cursor.getDate() + 1);
    }
    effectiveDays = gap;
  }

  let level: MomentumLevel;
  let label: string;

  if (effectiveDays <= 2) {
    level = 'green';
    label = effectiveDays === 0 ? 'Today' : effectiveDays === 1 ? 'Yesterday' : '2 days ago';
  } else if (effectiveDays <= 5) {
    level = 'amber';
    label = `${effectiveDays} days ago`;
  } else {
    level = 'red';
    label = `${effectiveDays} days ago`;
  }

  return { areaId: area.id, daysSinceLastSession: days, level, label };
}

// Given momentum for all areas, pick the one that needs attention most urgently:
// red first → amber → green → first area if tie.
export function suggestFocusArea(areas: Area[], momentumMap: Map<string, AreaMomentum>): Area | null {
  if (areas.length === 0) return null;

  const active = areas.filter(a => a.status === 'active');
  if (active.length === 0) return null;

  const priority: MomentumLevel[] = ['red', 'amber', 'green'];
  for (const level of priority) {
    const match = active.find(a => momentumMap.get(a.id)?.level === level);
    if (match) return match;
  }
  return active[0];
}
