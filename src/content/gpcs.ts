// Grapheme–phoneme correspondences in UK "Letters and Sounds" order
// (Phase 2 sets 1–5, Phase 3 sets 6–10). This is the same order used by
// Teach Your Monster to Read, so the progression will feel familiar.

export type GpcKind = 'cont' | 'stop' | 'vowel' | 'cons' | 'vdigraph';

export interface Gpc {
  id: string;
  grapheme: string;
  kind: GpcKind;
  set: number;
  /** Cue word whose FIRST sound is this GPC (or contains it for vowel digraphs). */
  cue: string;
  cueEmoji: string;
  /** SAPI phoneme string used to synthesize the isolated sound. */
  sapi: string;
  /** Speaking-rate adjustment for synthesis (percent). */
  rate: number;
  /** Tip shown in the recording studio. */
  tip: string;
  /** Visually confusable graphemes (used to sharpen distractors). */
  vis: string[];
  /** Auditorily confusable sounds. */
  aud: string[];
}

const STRETCH = 'Stretch it out — keep the sound going for a second.';
const CLIP = 'Clip it short. No "uh" on the end.';
const VOWEL = 'Say only the short vowel sound, held for a moment.';

export const GPCS: Gpc[] = [
  // ---- Set 1
  { id: 's', grapheme: 's', kind: 'cont', set: 1, cue: 'sun', cueEmoji: '☀️', sapi: 's', rate: -70, tip: STRETCH + ' "sssss" like a snake.', vis: ['z', 'c'], aud: ['z', 'sh', 'f'] },
  { id: 'a', grapheme: 'a', kind: 'vowel', set: 1, cue: 'apple', cueEmoji: '🍎', sapi: 'ae', rate: -40, tip: VOWEL + ' "a" as in apple.', vis: ['o', 'e'], aud: ['e', 'u'] },
  { id: 't', grapheme: 't', kind: 'stop', set: 1, cue: 'tent', cueEmoji: '⛺', sapi: 't', rate: 0, tip: CLIP + ' A tiny tick of the tongue.', vis: ['f', 'l', 'i'], aud: ['d', 'p', 'k'] },
  { id: 'p', grapheme: 'p', kind: 'stop', set: 1, cue: 'pig', cueEmoji: '🐷', sapi: 'p', rate: 0, tip: CLIP + ' A little puff of air.', vis: ['b', 'd', 'q'], aud: ['b', 't'] },
  // ---- Set 2
  { id: 'i', grapheme: 'i', kind: 'vowel', set: 2, cue: 'igloo', cueEmoji: '🧊', sapi: 'ih', rate: -40, tip: VOWEL + ' "i" as in igloo.', vis: ['l', 'j', 't'], aud: ['e', 'a'] },
  { id: 'n', grapheme: 'n', kind: 'cont', set: 2, cue: 'nose', cueEmoji: '👃', sapi: 'n', rate: -70, tip: STRETCH + ' "nnnn".', vis: ['m', 'h', 'u', 'r'], aud: ['m', 'ng'] },
  { id: 'm', grapheme: 'm', kind: 'cont', set: 2, cue: 'moon', cueEmoji: '🌙', sapi: 'm', rate: -70, tip: STRETCH + ' "mmmm" like something tastes good.', vis: ['n', 'w'], aud: ['n'] },
  { id: 'd', grapheme: 'd', kind: 'stop', set: 2, cue: 'dog', cueEmoji: '🐶', sapi: 'd ax', rate: 100, tip: CLIP + ' "d", not "duh".', vis: ['b', 'p', 'q', 'g'], aud: ['t', 'b', 'g'] },
  // ---- Set 3
  { id: 'g', grapheme: 'g', kind: 'stop', set: 3, cue: 'goat', cueEmoji: '🐐', sapi: 'g ax', rate: 100, tip: CLIP + ' "g", not "guh".', vis: ['q', 'd', 'p'], aud: ['k', 'd'] },
  { id: 'o', grapheme: 'o', kind: 'vowel', set: 3, cue: 'octopus', cueEmoji: '🐙', sapi: 'aa', rate: -40, tip: VOWEL + ' "o" as in octopus.', vis: ['a', 'c', 'e'], aud: ['u', 'a'] },
  { id: 'c', grapheme: 'c', kind: 'stop', set: 3, cue: 'cat', cueEmoji: '🐱', sapi: 'k', rate: 0, tip: CLIP + ' Same sound as k.', vis: ['o', 'e', 's'], aud: ['g', 't'] },
  { id: 'k', grapheme: 'k', kind: 'stop', set: 3, cue: 'kite', cueEmoji: '🪁', sapi: 'k', rate: 0, tip: CLIP + ' Same sound as c.', vis: ['h', 'x', 'l'], aud: ['g', 't'] },
  // ---- Set 4
  { id: 'ck', grapheme: 'ck', kind: 'stop', set: 4, cue: 'duck', cueEmoji: '🦆', sapi: 'k', rate: 0, tip: CLIP + ' Same as c and k — used at the end of words.', vis: ['c', 'k'], aud: ['g', 't'] },
  { id: 'e', grapheme: 'e', kind: 'vowel', set: 4, cue: 'egg', cueEmoji: '🥚', sapi: 'eh', rate: -40, tip: VOWEL + ' "e" as in egg.', vis: ['a', 'o', 'c'], aud: ['i', 'a'] },
  { id: 'u', grapheme: 'u', kind: 'vowel', set: 4, cue: 'umbrella', cueEmoji: '☂️', sapi: 'ah', rate: -40, tip: VOWEL + ' "u" as in up.', vis: ['n', 'v', 'y'], aud: ['o', 'a'] },
  { id: 'r', grapheme: 'r', kind: 'cont', set: 4, cue: 'rabbit', cueEmoji: '🐰', sapi: 'r', rate: -70, tip: STRETCH + ' "rrrr" like a growl — not "ruh".', vis: ['n', 'h'], aud: ['w', 'l'] },
  // ---- Set 5
  { id: 'h', grapheme: 'h', kind: 'cont', set: 5, cue: 'hat', cueEmoji: '🎩', sapi: 'h', rate: -30, tip: 'A short breathy "h", like a quiet pant.', vis: ['n', 'b', 'k'], aud: ['f'] },
  { id: 'b', grapheme: 'b', kind: 'stop', set: 5, cue: 'ball', cueEmoji: '⚽', sapi: 'b ax', rate: 100, tip: CLIP + ' "b", not "buh".', vis: ['d', 'p', 'q'], aud: ['p', 'd'] },
  { id: 'f', grapheme: 'f', kind: 'cont', set: 5, cue: 'fish', cueEmoji: '🐟', sapi: 'f', rate: -70, tip: STRETCH + ' "ffff".', vis: ['t', 'r'], aud: ['v', 'th', 's'] },
  { id: 'ff', grapheme: 'ff', kind: 'cont', set: 5, cue: 'puff', cueEmoji: '💨', sapi: 'f', rate: -70, tip: STRETCH + ' Same as f — at the end of words.', vis: ['f', 'll'], aud: ['v', 's'] },
  { id: 'l', grapheme: 'l', kind: 'cont', set: 5, cue: 'leg', cueEmoji: '🦵', sapi: 'l', rate: -70, tip: STRETCH + ' "llll".', vis: ['i', 't', 'll'], aud: ['r', 'n'] },
  { id: 'll', grapheme: 'll', kind: 'cont', set: 5, cue: 'bell', cueEmoji: '🔔', sapi: 'l', rate: -70, tip: STRETCH + ' Same as l — at the end of words.', vis: ['l', 'ff'], aud: ['r'] },
  { id: 'ss', grapheme: 'ss', kind: 'cont', set: 5, cue: 'hiss', cueEmoji: '🐍', sapi: 's', rate: -70, tip: STRETCH + ' Same as s — at the end of words.', vis: ['s', 'zz'], aud: ['z'] },
  // ---- Set 6 (Phase 3 consonants)
  { id: 'j', grapheme: 'j', kind: 'stop', set: 6, cue: 'jet', cueEmoji: '✈️', sapi: 'jh', rate: 0, tip: CLIP + ' "j" as in jet.', vis: ['i', 'g', 'y'], aud: ['ch', 'g'] },
  { id: 'v', grapheme: 'v', kind: 'cont', set: 6, cue: 'van', cueEmoji: '🚐', sapi: 'v', rate: -70, tip: STRETCH + ' "vvvv" — buzzy lips.', vis: ['u', 'w', 'y'], aud: ['f', 'b'] },
  { id: 'w', grapheme: 'w', kind: 'cont', set: 6, cue: 'web', cueEmoji: '🕸️', sapi: 'w', rate: -30, tip: 'A quick "w" — not "wuh".', vis: ['v', 'm'], aud: ['r', 'v'] },
  { id: 'x', grapheme: 'x', kind: 'stop', set: 6, cue: 'box', cueEmoji: '📦', sapi: 'k s', rate: -30, tip: '"ks" — as at the end of box.', vis: ['k', 'y'], aud: ['s', 'k'] },
  { id: 'y', grapheme: 'y', kind: 'cont', set: 6, cue: 'yo-yo', cueEmoji: '🪀', sapi: 'y', rate: -30, tip: 'A quick "y" as in yes — not "yuh".', vis: ['v', 'x', 'j'], aud: ['w'] },
  { id: 'z', grapheme: 'z', kind: 'cont', set: 6, cue: 'zebra', cueEmoji: '🦓', sapi: 'z', rate: -70, tip: STRETCH + ' "zzzz" like a bee.', vis: ['s', 'n'], aud: ['s'] },
  { id: 'zz', grapheme: 'zz', kind: 'cont', set: 6, cue: 'buzz', cueEmoji: '🐝', sapi: 'z', rate: -70, tip: STRETCH + ' Same as z — at the end of words.', vis: ['z', 'ss'], aud: ['s'] },
  { id: 'qu', grapheme: 'qu', kind: 'stop', set: 6, cue: 'queen', cueEmoji: '👑', sapi: 'k w', rate: -20, tip: '"kw" — two sounds squashed together.', vis: ['q', 'g'], aud: ['k', 'w'] },
  // ---- Set 7 (consonant digraphs)
  { id: 'ch', grapheme: 'ch', kind: 'stop', set: 7, cue: 'chick', cueEmoji: '🐤', sapi: 'ch', rate: -20, tip: CLIP + ' "ch" like a sneeze — not "chuh".', vis: ['sh', 'th', 'c'], aud: ['sh', 'j', 't'] },
  { id: 'sh', grapheme: 'sh', kind: 'cont', set: 7, cue: 'ship', cueEmoji: '🚢', sapi: 'sh', rate: -70, tip: STRETCH + ' "shhhh" — be quiet!', vis: ['ch', 'th', 's'], aud: ['s', 'ch'] },
  { id: 'th', grapheme: 'th', kind: 'cont', set: 7, cue: 'thumb', cueEmoji: '👍', sapi: 'th', rate: -70, tip: STRETCH + ' Tongue between teeth: "thhh" as in thumb.', vis: ['sh', 'ch', 't'], aud: ['f', 's'] },
  { id: 'ng', grapheme: 'ng', kind: 'cont', set: 7, cue: 'ring', cueEmoji: '💍', sapi: 'ng', rate: -60, tip: STRETCH + ' "nnng" — at the end of ring.', vis: ['n', 'g'], aud: ['n', 'm'] },
  // ---- Set 8 (vowel digraphs 1)
  { id: 'ai', grapheme: 'ai', kind: 'vdigraph', set: 8, cue: 'rain', cueEmoji: '🌧️', sapi: 'ey', rate: -40, tip: 'Long "ai" as in rain.', vis: ['a', 'oi', 'ar'], aud: ['ee', 'igh'] },
  { id: 'ee', grapheme: 'ee', kind: 'vdigraph', set: 8, cue: 'feet', cueEmoji: '🦶', sapi: 'iy', rate: -40, tip: 'Long "ee" as in feet.', vis: ['e', 'oo', 'ea'], aud: ['ai', 'i'] },
  { id: 'igh', grapheme: 'igh', kind: 'vdigraph', set: 8, cue: 'night', cueEmoji: '🌃', sapi: 'ay', rate: -40, tip: 'Long "igh" as in night.', vis: ['i', 'ing'], aud: ['ai', 'oi'] },
  { id: 'oa', grapheme: 'oa', kind: 'vdigraph', set: 8, cue: 'boat', cueEmoji: '⛵', sapi: 'ow', rate: -40, tip: 'Long "oa" as in boat.', vis: ['o', 'oo', 'oi'], aud: ['ow', 'oo'] },
  { id: 'oo', grapheme: 'oo', kind: 'vdigraph', set: 8, cue: 'moon', cueEmoji: '🌙', sapi: 'uw', rate: -40, tip: 'Long "oo" as in moon.', vis: ['o', 'oa', 'ee'], aud: ['oa', 'u'] },
  // ---- Set 9 (vowel digraphs 2)
  { id: 'ar', grapheme: 'ar', kind: 'vdigraph', set: 9, cue: 'car', cueEmoji: '🚗', sapi: 'aa r', rate: -30, tip: '"ar" as in car — like a pirate.', vis: ['a', 'or', 'ai'], aud: ['or', 'a'] },
  { id: 'or', grapheme: 'or', kind: 'vdigraph', set: 9, cue: 'fork', cueEmoji: '🍴', sapi: 'ao r', rate: -30, tip: '"or" as in fork.', vis: ['o', 'ar', 'oi'], aud: ['ar', 'ur'] },
  { id: 'ur', grapheme: 'ur', kind: 'vdigraph', set: 9, cue: 'surf', cueEmoji: '🏄', sapi: 'er', rate: -30, tip: '"ur" as in fur.', vis: ['u', 'ar', 'er'], aud: ['er', 'or'] },
  { id: 'ow', grapheme: 'ow', kind: 'vdigraph', set: 9, cue: 'cow', cueEmoji: '🐮', sapi: 'aw', rate: -40, tip: '"ow" as in cow — like you hurt your toe.', vis: ['oa', 'o', 'ou'], aud: ['oa', 'oi'] },
  { id: 'oi', grapheme: 'oi', kind: 'vdigraph', set: 9, cue: 'coin', cueEmoji: '🪙', sapi: 'oy', rate: -40, tip: '"oi" as in coin.', vis: ['oa', 'ai', 'o'], aud: ['igh', 'ow'] },
  // ---- Set 10 (vowel digraphs 3)
  { id: 'ear', grapheme: 'ear', kind: 'vdigraph', set: 10, cue: 'ear', cueEmoji: '👂', sapi: 'ih r', rate: -30, tip: '"ear" as in ear.', vis: ['ee', 'air', 'er'], aud: ['air', 'ee'] },
  { id: 'air', grapheme: 'air', kind: 'vdigraph', set: 10, cue: 'hair', cueEmoji: '💇', sapi: 'eh r', rate: -30, tip: '"air" as in hair.', vis: ['ai', 'ear', 'ar'], aud: ['ear', 'ar'] },
  { id: 'er', grapheme: 'er', kind: 'vdigraph', set: 10, cue: 'hammer', cueEmoji: '🔨', sapi: 'er', rate: -30, tip: '"er" as at the end of hammer.', vis: ['e', 'ur', 'ear'], aud: ['ur', 'or'] },
];

export const GPC_BY_ID: Record<string, Gpc> = Object.fromEntries(GPCS.map((g) => [g.id, g]));
export const MAX_SET = Math.max(...GPCS.map((g) => g.set));

export function gpcsInSet(set: number): Gpc[] {
  return GPCS.filter((g) => g.set === set);
}

/** Single letters only (for placement). */
export const SINGLE_LETTERS = GPCS.filter((g) => g.grapheme.length === 1);
