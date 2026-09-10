// Session composer: picks the next activity lazily so the session adapts as
// it goes (missed items come back, difficulty follows the staircase, one new
// sound at most per session, review items interleaved with frontier items).

import { GPCS, GPC_BY_ID, type Gpc } from '../content/gpcs.ts';
import { UNIQUE_WORDS, WORD_BY_SPELLING, type Word } from '../content/words.ts';
import { TRICKY, TRICKY_BY_WORD } from '../content/tricky.ts';
import { BKT } from './bkt.ts';
import { pickByExpected } from './elo.ts';
import {
  currentSet, eligibleWords, introducedGpcs, isMastered, knownTricky, makeSentence,
  nextGpcToIntroduce, nextTrickyToIntroduce, trickyAvailable, wordB,
} from './decodable.ts';
import { isDue, overdueDays } from './scheduler.ts';
import { stairLevel } from './observe.ts';
import type { Profile } from './state.ts';

export type Item =
  | { kind: 'intro'; gpc: string }
  | { kind: 'soundHunt'; gpc: string; choices: string[] }
  | { kind: 'firstSound'; gpc: string; choices: string[] }
  | { kind: 'blend'; word: string }
  | { kind: 'build'; word: string; tiles: string[] }
  | { kind: 'wordMatch'; word: string; choices: string[] }
  | { kind: 'read'; words: string[]; text: string }
  | { kind: 'tricky'; word: string; choices: string[]; intro: boolean };

export type Mechanic = Item['kind'];

export interface SessionCtx {
  total: number;
  count: number;
  coPlay: boolean;
  mechIdx: number;
  queue: Item[];
  missed: { item: Item; at: number; done: boolean }[];
  usedWords: Set<string>;
  recentGpcs: string[];
  newGpc: string | null;
  newTricky: string | null;
  rnd: () => number;
}

export function newSession(profile: Profile, coPlay: boolean, rnd: () => number = Math.random): SessionCtx {
  return {
    total: profile.settings.sessionItems,
    count: 0,
    coPlay,
    mechIdx: 0,
    queue: [],
    missed: [],
    usedWords: new Set(),
    recentGpcs: [],
    newGpc: null,
    newTricky: null,
    rnd,
  };
}

const PATTERN: Mechanic[] = [
  'soundHunt', 'blend', 'build', 'soundHunt', 'wordMatch', 'read', 'firstSound', 'tricky',
  'soundHunt', 'build', 'wordMatch', 'read', 'soundHunt', 'blend', 'tricky', 'firstSound',
];

// ---------------------------------------------------------------- helpers

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick<T>(items: T[], weight: (t: T) => number, rnd: () => number): T | null {
  const ws = items.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  if (!items.length || total <= 0) return null;
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function sameSound(a: Gpc, b: Gpc): boolean {
  return a.sapi === b.sapi;
}

// ------------------------------------------------------- target selection

function pickGpcTarget(profile: Profile, ctx: SessionCtx, now: number, filter?: (g: Gpc) => boolean): Gpc | null {
  let cands = introducedGpcs(profile);
  if (filter) cands = cands.filter(filter);
  if (!cands.length) return null;
  return weightedPick(
    cands,
    (g) => {
      const kc = profile.gpc[g.id];
      let w: number;
      if (isDue(kc, now)) w = 3 + Math.min(3, overdueDays(kc, now));
      else if (isMastered(kc.p, kc.days)) w = 0.25;
      else w = 1 + 2 * (1 - kc.p);
      if (ctx.recentGpcs.includes(g.id)) w *= 0.15;
      return w;
    },
    ctx.rnd,
  );
}

/** Distractor graphemes for a target, sharpened by staircase level. */
export function soundDistractors(profile: Profile, target: Gpc, level: number, rnd: () => number): string[] {
  const cur = currentSet(profile);
  const pool = GPCS.filter((g) => g.id !== target.id && g.set <= cur + 1 && !sameSound(g, target));
  const introduced = new Set(introducedGpcs(profile).map((g) => g.id));
  const conf = pool.filter((g) => target.vis.includes(g.id) || target.aud.includes(g.id));
  const plain = pool.filter((g) => !conf.includes(g));
  const preferIntro = (arr: Gpc[]) => [...shuffle(arr.filter((g) => introduced.has(g.id)), rnd), ...shuffle(arr.filter((g) => !introduced.has(g.id)), rnd)];
  const nChoices = level >= 4 ? 4 : 3;
  const nConf = level <= 1 ? 0 : level === 2 ? 1 : level === 3 ? 2 : 3;
  const chosen: Gpc[] = [];
  for (const g of preferIntro(conf)) if (chosen.length < nConf) chosen.push(g);
  // Level 1: avoid same-kind distractors (vowel vs consonant) when we can.
  const plainSorted = level <= 1
    ? [...preferIntro(plain.filter((g) => g.kind !== target.kind)), ...preferIntro(plain.filter((g) => g.kind === target.kind))]
    : preferIntro(plain);
  for (const g of plainSorted) if (chosen.length < nChoices - 1 && !chosen.includes(g)) chosen.push(g);
  for (const g of preferIntro(conf)) if (chosen.length < nChoices - 1 && !chosen.includes(g)) chosen.push(g);
  return chosen.map((g) => g.id);
}

function soundHuntItem(profile: Profile, ctx: SessionCtx, now: number, forced?: string): Item | null {
  const target = forced ? GPC_BY_ID[forced] : pickGpcTarget(profile, ctx, now);
  if (!target) return null;
  const level = stairLevel(profile, 'soundHunt');
  const distractors = soundDistractors(profile, target, level, ctx.rnd);
  if (distractors.length < 2) return null;
  return { kind: 'soundHunt', gpc: target.id, choices: shuffle([target.id, ...distractors], ctx.rnd) };
}

const PICTURED = UNIQUE_WORDS.filter((w) => w.emoji && (w.pos === 'n' || w.pos === 'v' || w.pos === 'adj'));

function firstSoundItem(profile: Profile, ctx: SessionCtx, now: number, forced?: string): Item | null {
  const startsWith = (g: Gpc) => PICTURED.filter((w) => sameSound(GPC_BY_ID[w.g[0]], g));
  const target = forced ? GPC_BY_ID[forced] : pickGpcTarget(profile, ctx, now, (g) => startsWith(g).length > 0);
  if (!target) return null;
  const correctWords = startsWith(target);
  if (!correctWords.length) return null;
  const correct = shuffle(correctWords.filter((w) => !ctx.usedWords.has(w.w)), ctx.rnd)[0] ?? shuffle(correctWords, ctx.rnd)[0];
  const level = stairLevel(profile, 'firstSound');
  const usedEmoji = new Set([correct.emoji]);
  const others = PICTURED.filter((w) => {
    const first = GPC_BY_ID[w.g[0]];
    return !sameSound(first, target) && !usedEmoji.has(w.emoji);
  });
  const confusable = others.filter((w) => target.aud.includes(w.g[0]) || target.vis.includes(w.g[0]));
  const plain = others.filter((w) => !confusable.includes(w));
  const n = level >= 4 ? 3 : 2;
  const nConf = level >= 3 ? Math.min(n, 1 + (level - 3)) : 0;
  const chosen: Word[] = [];
  const addFrom = (pool: Word[], max: number) => {
    for (const w of shuffle(pool, ctx.rnd)) {
      if (chosen.length >= max) break;
      if (usedEmoji.has(w.emoji)) continue;
      chosen.push(w);
      usedEmoji.add(w.emoji);
    }
  };
  addFrom(confusable, nConf);
  addFrom(plain, n);
  addFrom(confusable, n);
  if (chosen.length < 2) return null;
  return { kind: 'firstSound', gpc: target.id, choices: shuffle([correct.w, ...chosen.map((w) => w.w)], ctx.rnd) };
}

function freshWords(words: Word[], ctx: SessionCtx): Word[] {
  const fresh = words.filter((w) => !ctx.usedWords.has(w.w));
  return fresh.length >= 3 ? fresh : words;
}

function blendItem(profile: Profile, ctx: SessionCtx): Item | null {
  const words = freshWords(eligibleWords(profile, { minGraphemes: 2, maxGraphemes: 4 }), ctx);
  if (!words.length) return null;
  // Prefer unread words, common words, and words with pictures.
  const w = weightedPick(words, (x) => (profile.words[x.w]?.n ? 0.4 : 1.6) * (x.freq === 1 ? 1.5 : x.freq === 2 ? 1 : 0.6) * (x.emoji ? 1.4 : 1), ctx.rnd);
  return w ? { kind: 'blend', word: w.w } : null;
}

export function buildTiles(profile: Profile, word: Word, level: number, rnd: () => number): string[] {
  const known = introducedGpcs(profile).filter((g) => !word.g.includes(g.id));
  const inWord = word.g.map((id) => GPC_BY_ID[id]);
  const conf = known.filter((g) => inWord.some((w) => w.vis.includes(g.id) || w.aud.includes(g.id) || sameSound(w, g)));
  const plain = known.filter((g) => !conf.includes(g));
  const nExtra = level <= 1 ? 1 : level === 2 ? 2 : level === 3 ? 2 : 3;
  const nConf = level <= 2 ? 0 : level === 3 ? 1 : 2;
  const extras: Gpc[] = [];
  for (const g of shuffle(conf, rnd)) if (extras.length < nConf) extras.push(g);
  for (const g of shuffle(plain, rnd)) if (extras.length < nExtra) extras.push(g);
  for (const g of shuffle(conf, rnd)) if (extras.length < nExtra && !extras.includes(g)) extras.push(g);
  return shuffle([...word.g, ...extras.map((g) => g.id)], rnd);
}

function buildItem(profile: Profile, ctx: SessionCtx): Item | null {
  const words = freshWords(eligibleWords(profile, { minGraphemes: 2, maxGraphemes: 4 }), ctx);
  if (words.length < 2) return null;
  const w = pickByExpected(words, profile.elo.build.theta, (x) => wordB(profile, x), 0.8, ctx.rnd);
  if (!w) return null;
  return { kind: 'build', word: w.w, tiles: buildTiles(profile, w, stairLevel(profile, 'build'), ctx.rnd) };
}

function grDiff(a: Word, b: Word): number {
  if (a.g.length !== b.g.length) return 99;
  let d = 0;
  for (let i = 0; i < a.g.length; i++) if (a.g[i] !== b.g[i]) d++;
  return d;
}

export function matchDistractors(target: Word, pool: Word[], level: number, rnd: () => number): string[] {
  const others = pool.filter((w) => w.w.toLowerCase() !== target.w.toLowerCase());
  const n = level >= 4 ? 3 : 2;
  const minimal = others.filter((w) => grDiff(target, w) === 1);
  const shared = others.filter((w) => grDiff(target, w) === 2 || (w.g[0] === target.g[0] && w.g.length === target.g.length));
  const sameLen = others.filter((w) => w.g.length === target.g.length && w.g[0] !== target.g[0]);
  const easy = others.filter((w) => w.g[0] !== target.g[0]);
  let tiers: Word[][];
  if (level <= 1) tiers = [sameLen, easy, others];
  else if (level === 2) tiers = [sameLen, shared, easy, others];
  else if (level === 3) tiers = [shared, minimal, sameLen, others];
  else tiers = [minimal, shared, sameLen, others];
  const chosen: Word[] = [];
  for (const tier of tiers) {
    for (const w of shuffle(tier, rnd)) {
      if (chosen.length >= n) break;
      if (!chosen.includes(w)) chosen.push(w);
    }
  }
  return chosen.map((w) => w.w);
}

function wordMatchItem(profile: Profile, ctx: SessionCtx, forced?: string): Item | null {
  const all = eligibleWords(profile, { minGraphemes: 2, maxGraphemes: 5 });
  if (all.length < 3) return null;
  const words = freshWords(all, ctx);
  const target = forced ? WORD_BY_SPELLING[forced.toLowerCase()] : pickByExpected(words, profile.elo.match.theta, (x) => wordB(profile, x), 0.8, ctx.rnd);
  if (!target) return null;
  const distractors = matchDistractors(target, all, stairLevel(profile, 'wordMatch'), ctx.rnd);
  if (distractors.length < 2) return null;
  return { kind: 'wordMatch', word: target.w, choices: shuffle([target.w, ...distractors], ctx.rnd) };
}

function readItem(profile: Profile, ctx: SessionCtx): Item | null {
  if (!ctx.coPlay) return null;
  const words = freshWords(eligibleWords(profile, { minGraphemes: 2 }), ctx);
  if (words.length < 2) return null;
  const wantSentence = currentSet(profile) >= 2 && ctx.rnd() < 0.45;
  if (wantSentence) {
    const s = makeSentence(profile, ctx.rnd, ctx.usedWords);
    if (s) return { kind: 'read', words: s.words, text: s.text };
  }
  const w = pickByExpected(words, profile.elo.read.theta, (x) => wordB(profile, x), 0.8, ctx.rnd);
  return w ? { kind: 'read', words: [w.w], text: w.w } : null;
}

function trickyDistractors(profile: Profile, target: string, level: number, rnd: () => number): string[] {
  const introduced = TRICKY.filter((t) => t.w !== target && profile.tricky[t.w]?.intro).map((t) => t.w);
  const decodable = eligibleWords(profile, { maxGraphemes: 4 }).map((w) => w.w);
  const pool = [...introduced, ...decodable].filter((w) => w.toLowerCase() !== target.toLowerCase());
  const similar = pool.filter((w) => w[0].toLowerCase() === target[0].toLowerCase() || Math.abs(w.length - target.length) === 0);
  const tiers = level >= 3 ? [similar, pool] : [pool];
  const chosen: string[] = [];
  for (const tier of tiers) for (const w of shuffle(tier, rnd)) if (chosen.length < 2 && !chosen.includes(w)) chosen.push(w);
  return chosen;
}

function trickyItem(profile: Profile, ctx: SessionCtx, now: number, forced?: string): Item | null {
  const avail = trickyAvailable(profile);
  if (!avail.length) return null;
  let target: string | null = forced ?? null;
  let intro = false;
  if (!target) {
    const inPlay = avail.filter((t) => profile.tricky[t.w]?.intro);
    const inProgress = inPlay.filter((t) => profile.tricky[t.w].p < BKT.READY);
    const next = nextTrickyToIntroduce(profile);
    if (next && ctx.newTricky === null && inProgress.length < 2) {
      target = next.w;
      intro = true;
    } else if (inPlay.length) {
      const picked = weightedPick(inPlay, (t) => {
        const kc = profile.tricky[t.w];
        if (isDue(kc, now)) return 3;
        if (isMastered(kc.p, kc.days)) return 0.3;
        return 1 + 2 * (1 - kc.p);
      }, ctx.rnd);
      target = picked?.w ?? null;
    }
  }
  if (!target) return null;
  const distractors = trickyDistractors(profile, target, stairLevel(profile, 'tricky'), ctx.rnd);
  if (distractors.length < 2) return null;
  return { kind: 'tricky', word: target, choices: shuffle([target, ...distractors], ctx.rnd), intro };
}

// ------------------------------------------------------------ main entry

function available(profile: Profile, ctx: SessionCtx): Set<Mechanic> {
  const s = new Set<Mechanic>(['soundHunt', 'firstSound']);
  const words = eligibleWords(profile, { minGraphemes: 2, maxGraphemes: 5 });
  if (words.length >= 4) {
    s.add('blend');
    s.add('build');
    s.add('wordMatch');
    if (ctx.coPlay) s.add('read');
  }
  if (trickyAvailable(profile).length && introducedGpcs(profile).length >= 4) s.add('tricky');
  return s;
}

function variantOf(profile: Profile, ctx: SessionCtx, now: number, item: Item): Item | null {
  switch (item.kind) {
    case 'soundHunt': return soundHuntItem(profile, ctx, now, item.gpc);
    case 'firstSound': return soundHuntItem(profile, ctx, now, item.gpc);
    case 'wordMatch': return wordMatchItem(profile, ctx, item.word);
    case 'build': return wordMatchItem(profile, ctx, item.word);
    case 'tricky': return trickyItem(profile, ctx, now, item.word);
    case 'read': return item.words.length === 1 ? wordMatchItem(profile, ctx, item.words[0]) : null;
    default: return null;
  }
}

function noteUse(ctx: SessionCtx, item: Item): void {
  const gpc = 'gpc' in item ? item.gpc : null;
  if (gpc) {
    ctx.recentGpcs.push(gpc);
    if (ctx.recentGpcs.length > 3) ctx.recentGpcs.shift();
  }
  if ('word' in item) ctx.usedWords.add(item.word);
  if ('words' in item) for (const w of item.words) ctx.usedWords.add(w);
  if (item.kind === 'firstSound') ctx.usedWords.add(item.choices[0]);
}

export function nextItem(profile: Profile, ctx: SessionCtx, now = Date.now()): Item | null {
  if (ctx.count >= ctx.total) return null;
  const isLast = ctx.count === ctx.total - 1;

  let item: Item | null = null;

  if (ctx.queue.length) {
    item = ctx.queue.shift()!;
  } else if (isLast) {
    // End on a win: an unscored blend, or an easy sound hunt on a strong letter.
    item = blendItem(profile, ctx);
    if (!item) {
      const strong = introducedGpcs(profile).sort((a, b) => profile.gpc[b.id].p - profile.gpc[a.id].p)[0];
      item = strong ? soundHuntItem(profile, ctx, now, strong.id) : null;
    }
  } else {
    // Re-present a missed item a few turns later (fresh variant, once).
    const m = ctx.missed.find((x) => !x.done && ctx.count - x.at >= 3);
    if (m) {
      m.done = true;
      item = variantOf(profile, ctx, now, m.item);
    }
  }

  // Introduce one new sound per session, once warmed up, when the frontier is small.
  if (!item && ctx.newGpc === null && ctx.count >= 2) {
    const inProgress = introducedGpcs(profile).filter((g) => profile.gpc[g.id].p < BKT.READY).length;
    const next = nextGpcToIntroduce(profile);
    if (next && inProgress < 2) {
      ctx.newGpc = next.id;
      item = { kind: 'intro', gpc: next.id };
      // Immediate practice on the new sound with easy distractors.
      const d1 = soundDistractors(profile, next, 1, ctx.rnd);
      const d2 = soundDistractors(profile, next, 1, ctx.rnd);
      ctx.queue.push({ kind: 'soundHunt', gpc: next.id, choices: shuffle([next.id, ...d1], ctx.rnd) });
      ctx.queue.push({ kind: 'soundHunt', gpc: next.id, choices: shuffle([next.id, ...d2], ctx.rnd) });
    }
  }

  if (!item) {
    const avail = available(profile, ctx);
    for (let tries = 0; tries < PATTERN.length && !item; tries++) {
      const mech = PATTERN[ctx.mechIdx % PATTERN.length];
      ctx.mechIdx++;
      if (!avail.has(mech)) continue;
      switch (mech) {
        case 'soundHunt': item = soundHuntItem(profile, ctx, now); break;
        case 'firstSound': item = firstSoundItem(profile, ctx, now); break;
        case 'blend': item = blendItem(profile, ctx); break;
        case 'build': item = buildItem(profile, ctx); break;
        case 'wordMatch': item = wordMatchItem(profile, ctx); break;
        case 'read': item = readItem(profile, ctx); break;
        case 'tricky': item = trickyItem(profile, ctx, now); break;
        default: break;
      }
    }
  }
  if (!item) item = soundHuntItem(profile, ctx, now);
  if (!item) return null;

  if (item.kind === 'tricky' && item.intro) ctx.newTricky = item.word;
  noteUse(ctx, item);
  ctx.count++;
  return item;
}

/** Called by the session runner after a scored miss so the item returns later. */
export function noteMiss(ctx: SessionCtx, item: Item): void {
  if (item.kind === 'intro' || item.kind === 'blend') return;
  ctx.missed.push({ item, at: ctx.count, done: false });
}

export function isTrickyWord(w: string): boolean {
  return !!TRICKY_BY_WORD[w.toLowerCase()];
}

export { knownTricky };
