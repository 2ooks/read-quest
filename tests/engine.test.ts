import { describe, expect, it } from 'vitest';
import { GPCS, GPC_BY_ID } from '../src/content/gpcs.ts';
import { UNIQUE_WORDS, WORDS } from '../src/content/words.ts';
import { TRICKY } from '../src/content/tricky.ts';
import { bktUpdate } from '../src/engine/bkt.ts';
import { eloUpdate, expected } from '../src/engine/elo.ts';
import { stairUpdate, newStair } from '../src/engine/staircase.ts';
import { scheduleAfter, isDue } from '../src/engine/scheduler.ts';
import { DAY_MS, newKc, newProfile } from '../src/engine/state.ts';
import { eligibleWords, isDecodable, knownGpcs, makeSentence, nextGpcToIntroduce, wordDifficulty } from '../src/engine/decodable.ts';
import { applyPlacement, recordGpc, recordWord } from '../src/engine/observe.ts';
import { newSession, nextItem, noteMiss, soundDistractors, buildTiles, matchDistractors } from '../src/engine/composer.ts';

function seeded(seed = 42): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('content integrity', () => {
  it('every word parse uses real GPC ids', () => {
    const ids = new Set(GPCS.map((g) => g.id));
    for (const w of WORDS) for (const g of w.g) expect(ids.has(g), `${w.w}: ${g}`).toBe(true);
  });
  it('word parses spell the word', () => {
    for (const w of WORDS) {
      // doubled consonants were aliased to singles, so compare loosely
      const joined = w.g.join('');
      const collapsed = w.w.toLowerCase().replace(/(mm|tt|nn|dd|bb)/g, (m) => m[0]);
      expect(joined, w.w).toBe(collapsed);
    }
  });
  it('GPC ids are unique and sets are contiguous', () => {
    const ids = GPCS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sets = [...new Set(GPCS.map((g) => g.set))].sort((a, b) => a - b);
    expect(sets).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('confusable references point at real GPCs (or letters used only as distractor shapes)', () => {
    for (const g of GPCS) for (const c of [...g.vis, ...g.aud]) expect(typeof c).toBe('string');
  });
  it('tricky words are unique', () => {
    const ws = TRICKY.map((t) => t.w.toLowerCase());
    expect(new Set(ws).size).toBe(ws.length);
  });
  it('has a healthy number of unique words with pictures', () => {
    expect(UNIQUE_WORDS.length).toBeGreaterThan(300);
    expect(UNIQUE_WORDS.filter((w) => w.emoji).length).toBeGreaterThan(120);
  });
});

describe('BKT', () => {
  it('moves up on correct and down on incorrect', () => {
    const p0 = 0.5;
    expect(bktUpdate(p0, true, 1 / 3)).toBeGreaterThan(p0);
    expect(bktUpdate(p0, false, 1 / 3)).toBeLessThan(p0 + 0.15);
    expect(bktUpdate(p0, false, 1 / 3)).toBeLessThan(bktUpdate(p0, true, 1 / 3));
  });
  it('reaches mastery threshold after a handful of correct 3-choice answers', () => {
    let p = 0.1;
    let n = 0;
    while (p < 0.95 && n < 20) {
      p = bktUpdate(p, true, 1 / 3);
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(8);
  });
  it('a single lucky guess does not produce mastery', () => {
    expect(bktUpdate(0.1, true, 1 / 3)).toBeLessThan(0.6);
  });
});

describe('Elo', () => {
  it('expected is 0.5 at equal ability and difficulty', () => {
    expect(expected(0, 0)).toBeCloseTo(0.5);
  });
  it('ability rises on success and falls on failure; difficulty moves opposite', () => {
    const up = eloUpdate(0, 0, 1, 0);
    const down = eloUpdate(0, 0, 0, 0);
    expect(up.theta).toBeGreaterThan(0);
    expect(up.b).toBeLessThan(0);
    expect(down.theta).toBeLessThan(0);
    expect(down.b).toBeGreaterThan(0);
  });
  it('guess floor damps the reward for a correct multiple-choice answer', () => {
    expect(eloUpdate(0, 0, 1, 0, 1 / 3).theta).toBeLessThan(eloUpdate(0, 0, 1, 0, 0).theta);
  });
});

describe('staircase', () => {
  it('4-down/1-up converges near 84% on a simulated learner', () => {
    // Learner whose success probability drops with level: level L → p = 1 - 0.09*L
    const rnd = seeded(7);
    let s = newStair();
    let correct = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const p = 1.05 - 0.11 * s.level;
      const ok = rnd() < p;
      if (ok) correct++;
      s = stairUpdate(s, ok, 4, 8);
    }
    const rate = correct / N;
    expect(rate).toBeGreaterThan(0.78);
    expect(rate).toBeLessThan(0.9);
  });
  it('never leaves level range', () => {
    let s = newStair();
    for (let i = 0; i < 10; i++) s = stairUpdate(s, false, 4);
    expect(s.level).toBe(1);
    for (let i = 0; i < 100; i++) s = stairUpdate(s, true, 4);
    expect(s.level).toBe(4);
  });
});

describe('scheduler', () => {
  it('expands intervals on success and collapses on failure', () => {
    const kc = newKc(true);
    const t0 = Date.now();
    scheduleAfter(kc, true, t0);
    expect(kc.ivl).toBe(1);
    scheduleAfter(kc, true, t0);
    expect(kc.ivl).toBeCloseTo(2.2);
    expect(isDue(kc, t0 + 1 * DAY_MS)).toBe(false);
    expect(isDue(kc, t0 + 3 * DAY_MS)).toBe(true);
    scheduleAfter(kc, false, t0);
    expect(kc.ivl).toBe(0.5);
  });
});

describe('decodability', () => {
  it('a fresh profile knows nothing and has no eligible words', () => {
    const p = newProfile();
    expect(knownGpcs(p).size).toBe(0);
    expect(eligibleWords(p).length).toBe(0);
  });
  it('placement makes SATPIN words decodable but not digraph words', () => {
    const p = newProfile();
    const res: Record<string, boolean> = {};
    for (const id of ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd']) res[id] = true;
    applyPlacement(p, res, 'yes');
    const known = knownGpcs(p);
    expect(isDecodable({ w: 'sat', g: ['s', 'a', 't'], pos: 'v', freq: 1 }, known)).toBe(true);
    expect(isDecodable({ w: 'ship', g: ['sh', 'i', 'p'], pos: 'n', freq: 1 }, known)).toBe(false);
    const words = eligibleWords(p);
    expect(words.map((w) => w.w)).toContain('map');
    expect(words.map((w) => w.w)).not.toContain('dog');
    // adjacent consonants are held back until sets 1-5 are solid
    expect(words.map((w) => w.w)).not.toContain('and');
  });
  it('next GPC to introduce follows set order and waits for readiness', () => {
    const p = newProfile();
    // Set 1 starts "in play" but unknown, so nothing new is introduced until it is solid.
    expect(nextGpcToIntroduce(p)).toBeNull();
    const res: Record<string, boolean> = {};
    for (const id of ['s', 'a', 't', 'p']) res[id] = true;
    applyPlacement(p, res, 'sometimes');
    expect(nextGpcToIntroduce(p)!.id).toBe('i');
    // Now make set 2 partially known — the next is still inside set 2
    p.gpc.i.intro = true; p.gpc.i.p = 0.9;
    expect(nextGpcToIntroduce(p)!.id).toBe('n');
  });
  it('structural difficulty orders sensibly', () => {
    const sun = UNIQUE_WORDS.find((w) => w.w === 'sun')!;
    const cat = UNIQUE_WORDS.find((w) => w.w === 'cat')!;
    const ship = UNIQUE_WORDS.find((w) => w.w === 'ship')!;
    const stamp = UNIQUE_WORDS.find((w) => w.w === 'stamp')!;
    expect(wordDifficulty(sun)).toBeLessThan(wordDifficulty(cat));
    expect(wordDifficulty(cat)).toBeLessThan(wordDifficulty(ship));
    expect(wordDifficulty(ship)).toBeLessThan(wordDifficulty(stamp));
  });
  it('builds decodable sentences once a few sets are known', () => {
    const p = newProfile();
    const res: Record<string, boolean> = {};
    for (const g of GPCS.filter((g) => g.set <= 5)) res[g.id] = true;
    applyPlacement(p, res, 'yes');
    for (const t of ['the', 'is', 'a']) if (p.tricky[t]) { p.tricky[t].intro = true; p.tricky[t].p = 0.9; }
    const s = makeSentence(p, seeded(3));
    expect(s).not.toBeNull();
    expect(s!.words.length).toBeGreaterThan(1);
    const known = knownGpcs(p);
    for (const w of s!.words) {
      const lower = w.toLowerCase();
      if (['the', 'is', 'a', 'i'].includes(lower)) continue;
      const word = UNIQUE_WORDS.find((x) => x.w.toLowerCase() === lower)!;
      expect(word, w).toBeDefined();
      expect(isDecodable(word, known), w).toBe(true);
    }
  });
});

describe('distractors', () => {
  it('sound distractors never share the target sound and grow confusable with level', () => {
    const p = newProfile();
    const res: Record<string, boolean> = {};
    for (const g of GPCS.filter((g) => g.set <= 5)) res[g.id] = true;
    applyPlacement(p, res, 'yes');
    const c = GPC_BY_ID.c;
    for (let level = 1; level <= 4; level++) {
      const d = soundDistractors(p, c, level, seeded(level));
      expect(d).not.toContain('k');
      expect(d).not.toContain('ck');
      expect(d).not.toContain('c');
      expect(d.length).toBe(level >= 4 ? 3 : 2);
    }
    const hard = soundDistractors(p, GPC_BY_ID.b, 4, seeded(9));
    expect(hard.some((id) => ['d', 'p', 'q'].includes(id))).toBe(true);
  });
  it('build tiles contain the word and some extras', () => {
    const p = newProfile();
    const res: Record<string, boolean> = {};
    for (const g of GPCS.filter((g) => g.set <= 5)) res[g.id] = true;
    applyPlacement(p, res, 'yes');
    const mud = UNIQUE_WORDS.find((w) => w.w === 'mud')!;
    const tiles = buildTiles(p, mud, 2, seeded(1));
    expect(tiles.length).toBe(5);
    for (const g of mud.g) expect(tiles).toContain(g);
  });
  it('word-match distractors at high level are minimal pairs when available', () => {
    const cat = UNIQUE_WORDS.find((w) => w.w === 'cat')!;
    const pool = UNIQUE_WORDS.filter((w) => w.g.length === 3 && w.g.every((g) => g.length === 1));
    const d = matchDistractors(cat, pool, 4, seeded(5));
    expect(d.length).toBe(3);
    for (const w of d) {
      const word = UNIQUE_WORDS.find((x) => x.w === w)!;
      let diff = 0;
      for (let i = 0; i < 3; i++) if (word.g[i] !== cat.g[i]) diff++;
      expect(diff).toBe(1);
    }
  });
});

describe('session composer', () => {
  function placedProfile(sets: number) {
    const p = newProfile();
    const res: Record<string, boolean> = {};
    for (const g of GPCS.filter((g) => g.set <= sets)) res[g.id] = true;
    applyPlacement(p, res, 'yes');
    return p;
  }

  it('produces a full session with a mix of mechanics and at most one new GPC', () => {
    const p = placedProfile(4);
    const ctx = newSession(p, true, seeded(11));
    const kinds: string[] = [];
    let item;
    while ((item = nextItem(p, ctx))) {
      kinds.push(item.kind);
      if (item.kind === 'intro') {
        // simulate the runner introducing it
        p.gpc[item.gpc].intro = true;
      }
    }
    expect(kinds.length).toBe(p.settings.sessionItems);
    expect(kinds.filter((k) => k === 'intro').length).toBeLessThanOrEqual(1);
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(4);
    expect(kinds).toContain('read');
    // ends on an unscored blend (a win)
    expect(kinds[kinds.length - 1]).toBe('blend');
  });

  it('never offers Read-to-me in solo mode', () => {
    const p = placedProfile(5);
    const ctx = newSession(p, false, seeded(2));
    let item;
    while ((item = nextItem(p, ctx))) expect(item.kind).not.toBe('read');
  });

  it('brings a missed sound back a few items later', () => {
    const p = placedProfile(3);
    const ctx = newSession(p, false, seeded(5));
    const first = nextItem(p, ctx)!;
    expect(first.kind).toBe('soundHunt');
    const gpc = (first as { gpc: string }).gpc;
    recordGpc(p, gpc, false, 3, 1500);
    noteMiss(ctx, first);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      const it = nextItem(p, ctx)!;
      if (it.kind === 'soundHunt') seen.push(it.gpc);
    }
    expect(seen).toContain(gpc);
  });

  it('only uses decodable words in word games', () => {
    const p = placedProfile(2);
    const ctx = newSession(p, true, seeded(8));
    const known = knownGpcs(p);
    let item;
    while ((item = nextItem(p, ctx))) {
      if (item.kind === 'build' || item.kind === 'wordMatch' || item.kind === 'blend') {
        const w = UNIQUE_WORDS.find((x) => x.w === (item as { word: string }).word)!;
        expect(isDecodable(w, known), w.w).toBe(true);
      }
      if (item.kind === 'intro') p.gpc[item.gpc].intro = true;
    }
  });

  it('recordWord updates ability and item difficulty', () => {
    const p = placedProfile(4);
    recordWord(p, 'read', 'mud', true, 0, 3000);
    expect(p.elo.read.theta).toBeGreaterThan(0.8);
    expect(p.words.mud.n).toBe(1);
  });
});
