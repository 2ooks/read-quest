// Placement (grown-up led, ~3 minutes): show each letter, ask "what sound?",
// tap ✓ if she says the SOUND. Seeds the model so the game starts where she is.

import type { App } from '../../app.ts';
import { GPCS } from '../../content/gpcs.ts';
import { applyPlacement } from '../../engine/observe.ts';
import { h, clear } from '../dom.ts';

const PLACEMENT_IDS = [...GPCS.filter((g) => g.grapheme.length === 1).map((g) => g.id), 'sh', 'ch', 'th', 'ng'];

export function placementScreen(app: App): HTMLElement {
  const el = h('div', { class: 'screen' });
  const results: Record<string, boolean> = {};
  let i = 0;
  const body = h('div', { class: 'stage' });

  function intro(): void {
    clear(body);
    body.append(
      h('div', { class: 'card', style: { maxWidth: '760px' } },
        h('h1', {}, 'Grown-up: a quick sound check'),
        h('p', {}, 'Show your child each letter and ask “What sound does this make?” Tap ✓ if she says the sound (like “mmm”, not “em”). Tap ✗ if not — no need to correct her, the game will teach it.'),
        h('p', {}, 'This takes about 3 minutes and lets the game start exactly where she is. Letters she already knows are skipped ahead; ones she misses become the first things to practise.'),
        h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
          h('button', { class: 'btn green big', type: 'button', onclick: () => { i = 0; card(); } }, 'Start'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => finish('sometimes', true) }, 'Skip — start from the beginning'),
        ),
      ),
    );
  }

  function card(): void {
    if (i >= PLACEMENT_IDS.length) return blending();
    const id = PLACEMENT_IDS[i];
    const g = GPCS.find((x) => x.id === id)!;
    clear(body);
    const letter = h('div', { class: 'place-letter' }, g.grapheme);
    body.append(
      h('p', { class: 'muted' }, `${i + 1} of ${PLACEMENT_IDS.length} — “What sound does this make?”`),
      letter,
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '24px' } },
        h('button', { class: 'btn pink big', type: 'button', onclick: () => { results[id] = false; i++; card(); } }, '✗  Not yet'),
        h('button', { class: 'btn green big', type: 'button', onclick: () => { results[id] = true; i++; card(); } }, '✓  Said the sound'),
      ),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => app.audio.sound(id) }, '🔊 Hear it'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => { for (; i < PLACEMENT_IDS.length; i++) results[PLACEMENT_IDS[i]] = false; blending(); } }, 'Mark the rest “not yet”'),
      ),
    );
  }

  function blending(): void {
    clear(body);
    body.append(
      h('div', { class: 'card', style: { maxWidth: '760px' } },
        h('h2', {}, 'Can she blend a simple word?'),
        h('p', {}, 'For example: shown “m u d”, she says the sounds and then the word “mud”.'),
        h('div', { class: 'row', style: { justifyContent: 'center', gap: '16px' } },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => finish('no') }, 'Not yet'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => finish('sometimes') }, 'Sometimes'),
          h('button', { class: 'btn green', type: 'button', onclick: () => finish('yes') }, 'Yes ✓'),
        ),
      ),
    );
  }

  async function finish(blend: 'yes' | 'sometimes' | 'no', skipped = false): Promise<void> {
    if (!skipped) applyPlacement(app.profile, results, blend);
    else {
      app.profile.placed = true;
    }
    await app.save();
    app.go('home');
  }

  intro();
  el.appendChild(body);
  return el;
}
