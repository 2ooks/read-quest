// Turning game results into evidence: BKT updates for discrete facts,
// Elo updates for graded skills, review scheduling, staircase adjustment.

import { WORD_BY_SPELLING } from '../content/words.ts';
import { GPC_BY_ID } from '../content/gpcs.ts';
import { bktUpdate } from './bkt.ts';
import { eloUpdate } from './elo.ts';
import { wordDifficulty } from './decodable.ts';
import { scheduleAfter } from './scheduler.ts';
import { newStair, stairUpdate } from './staircase.ts';
import { isoDay, newKc, type KcState, type Profile } from './state.ts';

export const FAST_MS = 2000;

function touch(kc: KcState, correct: boolean, latencyMs: number, now: number): void {
  kc.n += 1;
  if (correct) {
    kc.c += 1;
    if (latencyMs > 0 && latencyMs < FAST_MS) kc.fast += 1;
    const d = isoDay(now);
    if (!kc.days.includes(d)) {
      kc.days.push(d);
      if (kc.days.length > 6) kc.days.shift();
    }
  }
  kc.intro = true;
  scheduleAfter(kc, correct, now);
}

export function recordGpc(profile: Profile, gpcId: string, correct: boolean, nChoices: number, latencyMs: number, now = Date.now()): void {
  const kc = (profile.gpc[gpcId] ??= newKc(true));
  kc.p = bktUpdate(kc.p, correct, nChoices > 0 ? 1 / nChoices : 0.02);
  touch(kc, correct, latencyMs, now);
  log(profile, 'gpc', gpcId, correct, latencyMs, false, now);
}

export function recordTricky(profile: Profile, word: string, correct: boolean, nChoices: number, latencyMs: number, now = Date.now()): void {
  const kc = (profile.tricky[word] ??= newKc(true));
  kc.p = bktUpdate(kc.p, correct, nChoices > 0 ? 1 / nChoices : 0.02);
  touch(kc, correct, latencyMs, now);
  log(profile, 'tricky', word, correct, latencyMs, false, now);
}

type EloSkill = 'read' | 'build' | 'match';

export function recordWord(profile: Profile, skill: EloSkill, spelling: string, correct: boolean, nChoices: number, latencyMs: number, now = Date.now()): void {
  const word = WORD_BY_SPELLING[spelling.toLowerCase()];
  const ws = (profile.words[spelling] ??= { b: word ? wordDifficulty(word) : 0, n: 0, c: 0, last: null });
  const elo = profile.elo[skill];
  const guess = nChoices > 0 ? 1 / nChoices : 0;
  const upd = eloUpdate(elo.theta, ws.b, correct ? 1 : 0, elo.n, guess);
  elo.theta = upd.theta;
  elo.n += 1;
  ws.b = upd.b;
  ws.n += 1;
  if (correct) ws.c += 1;
  ws.last = now;
  log(profile, skill, spelling, correct, latencyMs, false, now);
}

export function updateStair(profile: Profile, mechanic: string, correct: boolean): void {
  const s = profile.stair[mechanic] ?? newStair();
  profile.stair[mechanic] = stairUpdate(s, correct, profile.settings.stepUp);
}

export function stairLevel(profile: Profile, mechanic: string): number {
  return profile.stair[mechanic]?.level ?? 1;
}

export function introduceGpc(profile: Profile, gpcId: string, now = Date.now()): void {
  const kc = (profile.gpc[gpcId] ??= newKc(true));
  kc.intro = true;
  kc.last = now;
  log(profile, 'intro', gpcId, true, 0, false, now);
}

export function introduceTricky(profile: Profile, word: string, now = Date.now()): void {
  const kc = (profile.tricky[word] ??= newKc(true));
  kc.intro = true;
  kc.last = now;
  log(profile, 'intro-tricky', word, true, 0, false, now);
}

const LOG_CAP = 4000;

export function log(profile: Profile, kind: string, id: string, ok: boolean, ms: number, hint: boolean, t = Date.now()): void {
  profile.log.push({ t, kind, id, ok, ms: Math.round(ms), hint });
  if (profile.log.length > LOG_CAP) profile.log.splice(0, profile.log.length - LOG_CAP);
}

/** Apply a parent-judged placement: which letter-sounds she can already say. */
export function applyPlacement(profile: Profile, results: Record<string, boolean>, blending: 'yes' | 'sometimes' | 'no', now = Date.now()): void {
  let maxKnownSet = 1;
  for (const [id, ok] of Object.entries(results)) {
    const kc = (profile.gpc[id] ??= newKc(false));
    if (ok) {
      kc.p = 0.85;
      kc.intro = true;
      kc.days = [isoDay(now)];
      kc.ivl = 1;
      kc.due = now + 24 * 3600 * 1000;
      kc.last = now;
      const set = idSet(id);
      if (set > maxKnownSet) maxKnownSet = set;
    } else {
      kc.p = 0.1;
    }
  }
  // Letters she missed inside sets she has otherwise reached become the frontier.
  for (const [id, ok] of Object.entries(results)) {
    if (!ok && idSet(id) <= maxKnownSet) profile.gpc[id].intro = true;
  }
  const theta = blending === 'yes' ? 0.8 : blending === 'sometimes' ? 0 : -0.8;
  profile.elo.read.theta = theta;
  profile.elo.match.theta = theta;
  profile.elo.build.theta = theta - 0.3;
  profile.placed = true;
}

function idSet(id: string): number {
  return GPC_BY_ID[id]?.set ?? 1;
}
