// Elo-style ability/difficulty tracking for graded skills (reading words
// aloud, building words, matching words), after Klinkenberg, Straatemeier &
// van der Maas (2011) "Math Garden".

export interface EloUpdate {
  theta: number;
  b: number;
}

export function expected(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)));
}

/**
 * @param theta learner ability
 * @param b     item difficulty
 * @param score 1 correct, 0 incorrect
 * @param nTheta number of observations so far for the learner (shrinks K)
 * @param guess floor probability from guessing (1/choices for tap tasks, 0 for production)
 */
export function eloUpdate(theta: number, b: number, score: 0 | 1, nTheta: number, guess = 0): EloUpdate {
  const e = expected(theta, b);
  const eAdj = guess + (1 - guess) * e;
  const kTheta = Math.max(0.05, 0.15 / (1 + nTheta * 0.02));
  const kB = 0.05;
  const clamp = (x: number) => Math.max(-4, Math.min(4, x));
  return {
    theta: clamp(theta + kTheta * (score - eAdj)),
    b: clamp(b + kB * (eAdj - score)),
  };
}

/** Pick the item whose expected success is closest to `target`, with a little randomness. */
export function pickByExpected<T>(items: T[], theta: number, bOf: (t: T) => number, target = 0.8, rnd = Math.random): T | null {
  if (!items.length) return null;
  const scored = items
    .map((it) => ({ it, d: Math.abs(expected(theta, bOf(it)) - target) + rnd() * 0.12 }))
    .sort((a, b) => a.d - b.d);
  return scored[0].it;
}
