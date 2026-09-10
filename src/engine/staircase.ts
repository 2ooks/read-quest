// Transformed up-down staircase (Levitt, 1971). "1-up / N-down" converges to
// a success rate of 0.5^(1/N): N=3 → 79 %, N=4 → 84 %. The level controls
// how confusable distractors are — never whether an answer counts.

import type { Stair } from './state.ts';

export const MAX_LEVEL = 4;

export function newStair(): Stair {
  return { level: 1, streak: 0 };
}

export function stairUpdate(s: Stair, correct: boolean, stepUp: number, maxLevel = MAX_LEVEL): Stair {
  if (correct) {
    const streak = s.streak + 1;
    if (streak >= stepUp && s.level < maxLevel) return { level: s.level + 1, streak: 0 };
    return { level: s.level, streak };
  }
  return { level: Math.max(1, s.level - 1), streak: 0 };
}
