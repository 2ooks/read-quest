// Bayesian Knowledge Tracing (Corbett & Anderson, 1995).
// One hidden binary "known" state per skill, four parameters.

export const BKT = {
  /** p(transit): chance of learning the skill on each practice opportunity. */
  T: 0.15,
  /** p(slip): chance of a wrong answer despite knowing. Set high-ish for 4-year-old mis-taps. */
  S: 0.15,
  /** "Ready to build on" threshold. */
  READY: 0.8,
  /** "Mastered — review only" threshold (also needs correct answers on 2 different days). */
  MASTERED: 0.95,
};

/**
 * Update p(known) after observing a first, unaided response.
 * @param p      prior p(known)
 * @param correct observed response
 * @param guess  p(guess): 1 / number of choices for a tap task; ~0 for production
 */
export function bktUpdate(p: number, correct: boolean, guess: number, T = BKT.T, S = BKT.S): number {
  const g = Math.min(Math.max(guess, 0), 0.5);
  let post: number;
  if (correct) {
    post = (p * (1 - S)) / (p * (1 - S) + (1 - p) * g);
  } else {
    post = (p * S) / (p * S + (1 - p) * (1 - g));
  }
  if (!Number.isFinite(post)) post = p;
  const next = post + (1 - post) * T;
  return Math.min(0.999, Math.max(0.001, next));
}

/** Predicted probability of a correct response. */
export function bktPredict(p: number, guess: number, S = BKT.S): number {
  return p * (1 - S) + (1 - p) * guess;
}
