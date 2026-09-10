// Expanding-interval review scheduler (Leitner-style with time). Adequate for
// ~60 letter-sounds and ~40 tricky words practised most days; intervals grow
// ×2.2 on success (cap 30 days) and collapse to half a day on failure.

import { DAY_MS, type KcState } from './state.ts';

export const SCHED = { GROW: 2.2, FIRST: 1, FAIL: 0.5, MAX: 30 };

export function scheduleAfter(kc: KcState, correct: boolean, now: number): void {
  if (correct) {
    kc.ivl = kc.ivl <= 0 ? SCHED.FIRST : Math.min(SCHED.MAX, kc.ivl * SCHED.GROW);
  } else {
    kc.ivl = SCHED.FAIL;
  }
  kc.due = now + kc.ivl * DAY_MS;
  kc.last = now;
}

export function isDue(kc: KcState, now: number): boolean {
  return kc.intro && kc.due !== null && now >= kc.due;
}

export function overdueDays(kc: KcState, now: number): number {
  if (kc.due === null) return 0;
  return Math.max(0, (now - kc.due) / DAY_MS);
}
