// Knowledge queries: what does the child know, and which words/sentences are
// decodable *relative to what has been taught* (the Bob Books principle).

import { GPCS, GPC_BY_ID, MAX_SET, type Gpc } from '../content/gpcs.ts';
import { UNIQUE_WORDS, WORD_BY_SPELLING, type Pos, type Word } from '../content/words.ts';
import { TRICKY, TRICKY_BY_WORD, type TrickyWord } from '../content/tricky.ts';
import { SENTENCE_TEMPLATES } from '../content/sentences.ts';
import { BKT } from './bkt.ts';
import type { Profile } from './state.ts';

export function knownGpcs(profile: Profile, threshold = BKT.READY): Set<string> {
  const s = new Set<string>();
  for (const g of GPCS) {
    const k = profile.gpc[g.id];
    if (k && k.intro && k.p >= threshold) s.add(g.id);
  }
  return s;
}

export function introducedGpcs(profile: Profile): Gpc[] {
  return GPCS.filter((g) => profile.gpc[g.id]?.intro);
}

export function isMastered(p: number, days: string[]): boolean {
  return p >= BKT.MASTERED && days.length >= 2;
}

/** Highest set that has any introduced GPC (1 if none). */
export function currentSet(profile: Profile): number {
  let s = 1;
  for (const g of GPCS) if (profile.gpc[g.id]?.intro) s = Math.max(s, g.set);
  return s;
}

/** All GPCs in `set` are at least READY. */
export function setReady(profile: Profile, set: number, threshold = BKT.READY): boolean {
  return GPCS.filter((g) => g.set === set).every((g) => (profile.gpc[g.id]?.p ?? 0) >= threshold);
}

/** Next GPC to introduce, or null if capped / finished. */
export function nextGpcToIntroduce(profile: Profile): Gpc | null {
  const maxSet = Math.min(profile.settings.maxSet, MAX_SET);
  for (const g of GPCS) {
    if (g.set > maxSet) return null;
    if (!profile.gpc[g.id]?.intro) {
      // Only move into a new set once the previous set is solid.
      if (g.set > 1 && !setReady(profile, g.set - 1)) return null;
      return g;
    }
  }
  return null;
}

export function knownTricky(profile: Profile, threshold = BKT.READY): Set<string> {
  const s = new Set<string>();
  for (const t of TRICKY) {
    const k = profile.tricky[t.w];
    if (k && k.intro && k.p >= threshold) s.add(t.w.toLowerCase());
  }
  return s;
}

export function trickyAvailable(profile: Profile): TrickyWord[] {
  const cur = currentSet(profile);
  return TRICKY.filter((t) => t.set <= cur);
}

export function nextTrickyToIntroduce(profile: Profile): TrickyWord | null {
  for (const t of trickyAvailable(profile)) {
    if (!profile.tricky[t.w]?.intro) return t;
  }
  return null;
}

export function hasAdjacentConsonants(word: Word): boolean {
  const kinds = word.g.map((id) => GPC_BY_ID[id]?.kind);
  for (let i = 0; i < kinds.length - 1; i++) {
    const a = kinds[i];
    const b = kinds[i + 1];
    if (a && b && a !== 'vowel' && a !== 'vdigraph' && b !== 'vowel' && b !== 'vdigraph') return true;
  }
  return false;
}

export function isDecodable(word: Word, known: Set<string>): boolean {
  return word.g.every((id) => known.has(id));
}

export interface EligibleOpts {
  needEmoji?: boolean;
  maxGraphemes?: number;
  minGraphemes?: number;
  pos?: Pos[];
  threshold?: number;
}

/** Words the child can decode with currently known GPCs. */
export function eligibleWords(profile: Profile, opts: EligibleOpts = {}): Word[] {
  const known = knownGpcs(profile, opts.threshold ?? BKT.READY);
  const adjacentOk = [1, 2, 3, 4, 5].every((s) => setReady(profile, s));
  return UNIQUE_WORDS.filter((w) => {
    if (!isDecodable(w, known)) return false;
    if (opts.needEmoji && !w.emoji) return false;
    if (opts.maxGraphemes && w.g.length > opts.maxGraphemes) return false;
    if (opts.minGraphemes && w.g.length < opts.minGraphemes) return false;
    if (opts.pos && !opts.pos.includes(w.pos)) return false;
    if (!adjacentOk && hasAdjacentConsonants(w)) return false;
    return true;
  });
}

/** Seed Elo difficulty for reading a word aloud from its structure. */
export function wordDifficulty(word: Word): number {
  let d = 0;
  const first = GPC_BY_ID[word.g[0]];
  if (first && first.kind === 'stop') d += 0.3;
  d += Math.max(0, word.g.length - 3) * 0.35;
  if (word.g.some((id) => id.length >= 2 && GPC_BY_ID[id]?.kind !== 'vdigraph')) d += 0.4;
  if (word.g.some((id) => GPC_BY_ID[id]?.kind === 'vdigraph')) d += 0.5;
  if (hasAdjacentConsonants(word)) d += 0.6;
  if (word.freq === 1) d -= 0.2;
  if (word.freq === 3) d += 0.2;
  return d;
}

export function wordB(profile: Profile, word: Word): number {
  return profile.words[word.w]?.b ?? wordDifficulty(word);
}

/** Is a token readable right now? (decodable word or known tricky word) */
export function tokenReadable(token: string, known: Set<string>, tricky: Set<string>): boolean {
  const clean = token.replace(/[.,!?]/g, '');
  const lower = clean.toLowerCase();
  if (lower === 'i') return tricky.has('i');
  if (tricky.has(lower)) return true;
  const w = WORD_BY_SPELLING[lower];
  return !!w && isDecodable(w, known);
}

export interface Sentence {
  text: string;
  words: string[];
}

function pick<T>(arr: T[], rnd: () => number): T | undefined {
  return arr.length ? arr[Math.floor(rnd() * arr.length)] : undefined;
}

/** Build a decodable sentence from templates, or null if none fit. */
export function makeSentence(profile: Profile, rnd = Math.random, avoid: Set<string> = new Set()): Sentence | null {
  const known = knownGpcs(profile);
  const tricky = knownTricky(profile);
  const cur = currentSet(profile);
  const words = eligibleWords(profile);
  const nouns = words.filter((w) => w.pos === 'n' && !avoid.has(w.w));
  const verbs = words.filter((w) => w.pos === 'v' && !avoid.has(w.w));
  const adjs = words.filter((w) => w.pos === 'adj' && !avoid.has(w.w));
  const names = words.filter((w) => w.pos === 'nm');
  const templates = SENTENCE_TEMPLATES.filter((t) => t.minSet <= cur)
    .filter((t) => t.t.split(/\s+/).every((tok) => tok.startsWith('{') || tokenReadable(tok, known, tricky)))
    .sort(() => rnd() - 0.5);

  for (const tpl of templates) {
    const used = new Set<string>();
    let ok = true;
    const out = tpl.t.replace(/\{(\w+)\}/g, (_, slot: string) => {
      let pool: Word[];
      if (slot.startsWith('n')) pool = slot.startsWith('nm') ? names : nouns;
      else if (slot === 'v') pool = verbs;
      else pool = adjs;
      const cand = pool.filter((w) => !used.has(w.w));
      const w = pick(cand, rnd);
      if (!w) {
        ok = false;
        return '';
      }
      used.add(w.w);
      return w.w;
    });
    if (!ok) continue;
    const text = out.charAt(0).toUpperCase() + out.slice(1);
    return { text, words: out.split(/\s+/).map((t) => t.replace(/[.,!?]/g, '')) };
  }
  return null;
}

export function isTricky(token: string): TrickyWord | undefined {
  return TRICKY_BY_WORD[token.toLowerCase()];
}
