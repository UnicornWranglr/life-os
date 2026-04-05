// Seed script — run once after Phase 1 deployment.
// Usage: npm run db:seed
// Creates: user, vision, 5 areas, 3 habits, and example life tasks.

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, pool } from './index';
import {
  users, vision, areas, habits, lifeTasks,
} from './schema';

async function seed() {
  console.log('Seeding database...');

  // ── User ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('changeme', 10);
  const [user] = await db
    .insert(users)
    .values({ email: 'daniel@lifeos.app', passwordHash })
    .returning()
    .onConflictDoNothing();

  if (!user) {
    console.log('User already exists — skipping seed (run only once).');
    return;
  }

  console.log(`Created user: ${user.email}`);

  // ── Vision ────────────────────────────────────────────────────────────
  await db.insert(vision).values({
    userId: user.id,
    statement: 'Full-time digital nomad swing trader by Q2 2028',
  });

  // ── Areas ─────────────────────────────────────────────────────────────
  const areaData = [
    { name: 'Trading',              type: 'income_building' as const, focusBudgetPct: 35, color: '#4CAF50', weekdaysOnly: true  },
    { name: 'Trading Journal App',  type: 'project'         as const, focusBudgetPct: 20, color: '#2196F3', weekdaysOnly: false },
    { name: 'Life OS',              type: 'project'         as const, focusBudgetPct: 15, color: '#9C27B0', weekdaysOnly: false },
    { name: 'Peak Processing',      type: 'obligation'      as const, focusBudgetPct: 20, color: '#FF9800', weekdaysOnly: true  },
    { name: 'Financial & Lifestyle',type: 'vision'          as const, focusBudgetPct: 10, color: '#F44336', weekdaysOnly: false },
  ];

  const createdAreas = await db
    .insert(areas)
    .values(areaData.map(a => ({ userId: user.id, ...a })))
    .returning();

  console.log(`Created ${createdAreas.length} areas`);

  const tradingArea   = createdAreas.find(a => a.name === 'Trading')!;
  const lifeOsArea    = createdAreas.find(a => a.name === 'Life OS')!;

  // ── Habits ────────────────────────────────────────────────────────────
  await db.insert(habits).values([
    { userId: user.id, areaId: tradingArea.id, name: 'Pre-market chart review' },
    { userId: user.id, areaId: tradingArea.id, name: 'Trade journal entry logged' },
    { userId: user.id, areaId: lifeOsArea.id,  name: 'Life OS session log completed' },
  ]);

  console.log('Created 3 habits');

  // ── Life tasks ────────────────────────────────────────────────────────
  await db.insert(lifeTasks).values([
    {
      userId: user.id,
      name: 'Check & respond to messages',
      category: 'admin',
      scheduleType: 'daily',
      scheduleConfig: {},
      scope: 'daily',
    },
    {
      userId: user.id,
      name: 'Tidy kitchen',
      category: 'cleaning',
      scheduleType: 'daily',
      scheduleConfig: {},
      scope: 'daily',
    },
    {
      userId: user.id,
      name: 'Cook dinner',
      category: 'cooking',
      scheduleType: 'days_of_week',
      scheduleConfig: { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      scope: 'daily',
    },
    {
      userId: user.id,
      name: 'Vacuum',
      category: 'cleaning',
      scheduleType: 'every_n_weeks',
      scheduleConfig: { every: 1, day: 'saturday' },
      scope: 'daily',
    },
    {
      userId: user.id,
      name: 'Weekly review',
      category: 'admin',
      scheduleType: 'weekly_floating',
      scheduleConfig: {},
      scope: 'weekly',
    },
  ]);

  console.log('Created life tasks');
  console.log('\nSeed complete.');
  console.log('Login with: daniel@lifeos.app / changeme');
}

seed()
  .catch(err => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => pool.end());
