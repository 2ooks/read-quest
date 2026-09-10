// Emits tools/manifest.json: every audio clip the app expects, with the SSML
// used to synthesize a baseline version. Run with: node tools/gen-manifest.ts
import { writeFileSync } from 'node:fs';
import { GPCS } from '../src/content/gpcs.ts';
import { UNIQUE_WORDS } from '../src/content/words.ts';
import { TRICKY } from '../src/content/tricky.ts';
import { PHRASES } from '../src/content/phrases.ts';
import { clipIdForSound, clipIdForWord, clipIdForBlend, clipIdForPhrase } from '../src/audio/clips.ts';

interface Clip { id: string; kind: 'sound' | 'word' | 'blend' | 'phrase'; text: string; ssml: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&apos;');
const clips: Clip[] = [];

for (const g of GPCS) {
  const inner = `<phoneme alphabet='x-microsoft-sapi' ph='${g.sapi}'>${g.grapheme}</phoneme>`;
  const ssml = g.rate ? `<prosody rate='${g.rate > 0 ? '+' : ''}${g.rate}%'>${inner}</prosody>` : inner;
  clips.push({ id: clipIdForSound(g.id), kind: 'sound', text: g.grapheme, ssml });
}

const words = new Set<string>();
for (const w of UNIQUE_WORDS) words.add(w.w);
for (const t of TRICKY) words.add(t.w);
for (const w of words) {
  clips.push({ id: clipIdForWord(w), kind: 'word', text: w, ssml: `<prosody rate='-12%'>${esc(w)}</prosody>` });
}
for (const w of UNIQUE_WORDS) {
  if (w.g.length <= 5) {
    clips.push({ id: clipIdForBlend(w.w), kind: 'blend', text: w.w, ssml: `<prosody rate='-65%'>${esc(w.w)}</prosody>` });
  }
}
for (const [id, text] of Object.entries(PHRASES)) {
  clips.push({ id: clipIdForPhrase(id), kind: 'phrase', text, ssml: `<prosody rate='-6%'>${esc(text)}</prosody>` });
}

writeFileSync(new URL('./manifest.json', import.meta.url), JSON.stringify(clips, null, 1));
console.log(`wrote ${clips.length} clips (${clips.filter((c) => c.kind === 'sound').length} sounds, ${words.size} words, ${clips.filter((c) => c.kind === 'blend').length} blends, ${Object.keys(PHRASES).length} phrases)`);
