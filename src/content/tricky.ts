// "Tricky" (heart) words: high-frequency words that are not fully decodable
// with the GPCs taught so far. Each grapheme is marked regular or irregular
// so the game can show the "heart" part. Order follows Letters and Sounds.

export interface TrickyPart {
  g: string;
  irregular: boolean;
}

export interface TrickyWord {
  w: string;
  parts: TrickyPart[];
  /** Unlocks once this GPC set is reached. */
  set: number;
}

function T(w: string, spec: string, set: number): TrickyWord {
  // spec: graphemes separated by '-', irregular ones suffixed with '*'
  const parts = spec.split('-').map((p) => ({ g: p.replace('*', ''), irregular: p.endsWith('*') }));
  return { w, parts, set };
}

export const TRICKY: TrickyWord[] = [
  // Phase 2
  T('the', 'th-e*', 2), T('to', 't-o*', 2), T('I', 'I*', 2), T('no', 'n-o*', 3), T('go', 'g-o*', 3), T('into', 'i-n-t-o*', 3),
  T('is', 'i-s*', 2), T('his', 'h-i-s*', 5), T('has', 'h-a-s*', 5), T('as', 'a-s*', 2),
  // Phase 3
  T('he', 'h-e*', 5), T('she', 'sh-e*', 7), T('we', 'w-e*', 6), T('me', 'm-e*', 5), T('be', 'b-e*', 5),
  T('was', 'w-a*-s*', 6), T('you', 'y-ou*', 6), T('they', 'th-ey*', 7), T('all', 'a*-ll', 5), T('are', 'ar-e*', 6),
  T('my', 'm-y*', 6), T('her', 'h-er', 7),
  // Phase 4
  T('said', 's-ai*-d', 8), T('have', 'h-a-v-e*', 8), T('like', 'l-i*-k-e*', 8), T('so', 's-o*', 8), T('do', 'd-o*', 8),
  T('some', 's-o*-m-e*', 8), T('come', 'c-o*-m-e*', 8), T('were', 'w-ere*', 8), T('there', 'th-ere*', 8),
  T('little', 'l-i-tt-le*', 9), T('one', 'one*', 9), T('when', 'wh*-e-n', 9), T('out', 'ou*-t', 9), T('what', 'wh*-a*-t', 9),
];

export const TRICKY_BY_WORD: Record<string, TrickyWord> = Object.fromEntries(TRICKY.map((t) => [t.w.toLowerCase(), t]));
