// Placement: find out which sounds she already knows so the game starts where
// she is. Two routes, both led by the monster:
//   • Sound Show — the monster holds up a letter, she says the sound, the
//     grown-up taps ✓/✗. The monster reacts every time and "says it too".
//     Ends on its own once she is past her frontier (4 misses in a row).
//   • Quick Start — the grown-up ticks what she knows (~30 s, no child needed).

import type { App } from '../../app.ts';
import { GPCS, GPC_BY_ID, MAX_SET, gpcsInSet } from '../../content/gpcs.ts';
import { applyPlacement } from '../../engine/observe.ts';
import { h, clear, wait } from '../dom.ts';
import { confetti, scene, sparkleAt } from '../feedback.ts';
import { monsterSvg } from '../monster.ts';

const SINGLE_IDS = GPCS.filter((g) => g.grapheme.length === 1).map((g) => g.id);
const DIGRAPH_IDS = ['sh', 'ch', 'th', 'ng'];
const STOP_AFTER_MISSES = 4;
const DIGRAPHS_IF_KNOWN = 22;

type Blend = 'yes' | 'sometimes' | 'no';

/** Swap the monster's animation class, restarting it. */
export function mood(wrap: HTMLElement, m: 'happy' | 'shrug' | 'dance', resetMs = 1200): void {
  wrap.classList.remove('bob', 'happy', 'shrug', 'dance');
  void wrap.offsetWidth;
  wrap.classList.add(m);
  if (resetMs) {
    setTimeout(() => {
      wrap.classList.remove(m);
      wrap.classList.add('bob');
    }, resetMs);
  }
}

export function placementScreen(app: App): HTMLElement {
  const el = h('div', { class: 'screen' });
  el.appendChild(scene());
  const body = h('div', { class: 'stage' });
  el.appendChild(body);
  const name = app.profile.monster.name || 'Your monster';

  function chooser(): void {
    clear(body);
    el.classList.remove('scroll');
    const mon = h('div', { class: 'monster-wrap bob', style: { width: '150px', height: '150px' }, html: monsterSvg(app.profile.monster) });
    body.append(
      h('div', { class: 'card', style: { maxWidth: '860px' } },
        h('div', { class: 'row' }, mon, h('div', { class: 'grow' }, h('h1', {}, 'Before the first quest'), h('p', {}, `${name} wants to know which sounds she already knows, so the game can start right where she is. Grown-up, pick one:`))),
        h('div', { class: 'stack', style: { alignItems: 'stretch', marginTop: '6px' } },
          h('button', { class: 'btn green big', type: 'button', onclick: soundShow }, '🎪  Play the Sound Show together'),
          h('p', { class: 'muted center' }, `About 2 minutes. ${name} holds up a letter, she says the sound, you tap ✓ or ✗. It stops by itself once she is past what she knows.`),
          h('button', { class: 'btn yellow', type: 'button', onclick: quickStart }, '⚡  Quick start — I will tick what she knows'),
          h('p', { class: 'muted center' }, '30 seconds, no child needed. The game double-checks as she plays.'),
        ),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => finish({}, 'sometimes', true) }, 'Skip — start from the very beginning'),
        ),
      ),
    );
  }

  // ------------------------------------------------------------ Sound Show
  function soundShow(): void {
    clear(body);
    el.classList.remove('scroll');
    const results: Record<string, boolean> = {};
    const queue = [...SINGLE_IDS];
    let i = 0;
    let misses = 0;
    let known = 0;
    let busy = true;
    let finished = false;

    const mon = h('div', { class: 'monster-wrap bob show-monster', html: monsterSvg(app.profile.monster) });
    mon.addEventListener('pointerdown', () => {
      mood(mon, 'happy');
      app.audio.tone('yes');
    });
    const sign = h('div', { class: 'sign' }, '?');
    const tray = h('div', { class: 'tray' });
    const noBtn = h('button', { class: 'btn pink', type: 'button', onclick: () => void answer(false) }, '✗  Not yet');
    const yesBtn = h('button', { class: 'btn green', type: 'button', onclick: () => void answer(true) }, '✓  She said it');
    const hearBtn = h('button', { class: 'btn ghost small', type: 'button', title: 'Hear the sound', onclick: () => { if (i < queue.length) void app.audio.sound(queue[i]); } }, '🔊');
    const stopBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: () => void done() }, 'Finish here');
    const strip = h('div', { class: 'grownup' }, h('div', { class: 'label' }, 'Grown-up: did she say the sound?'), hearBtn, noBtn, yesBtn, stopBtn);
    body.append(h('div', { class: 'show-row' }, mon, sign), tray, strip);

    const setBusy = (b: boolean) => {
      busy = b;
      noBtn.disabled = b;
      yesBtn.disabled = b;
    };
    setBusy(true);

    async function card(): Promise<void> {
      if (finished) return;
      if (i >= queue.length) return done();
      const g = GPC_BY_ID[queue[i]];
      sign.textContent = g.grapheme;
      sign.classList.remove('pop');
      void sign.offsetWidth;
      sign.classList.add('pop');
      if (i < 2) await app.audio.phrase('what_sound');
      else app.audio.tone('tap');
      setBusy(false);
    }

    async function answer(ok: boolean): Promise<void> {
      if (busy || finished) return;
      setBusy(true);
      const id = queue[i];
      results[id] = ok;
      if (ok) {
        known++;
        misses = 0;
        mood(mon, 'happy');
        app.audio.tone('yes');
        sparkleAt(sign);
        tray.appendChild(h('span', { class: 'mini pop' }, GPC_BY_ID[id].grapheme));
      } else {
        misses++;
        mood(mon, 'shrug');
      }
      // The monster says it too — modelling, not correcting.
      await app.audio.sound(id);
      i++;
      if (i === SINGLE_IDS.length && known >= DIGRAPHS_IF_KNOWN) queue.push(...DIGRAPH_IDS);
      if (misses >= STOP_AFTER_MISSES) return done();
      await wait(150);
      void card();
    }

    async function done(): Promise<void> {
      if (finished) return;
      finished = true;
      setBusy(true);
      for (const id of [...SINGLE_IDS, ...DIGRAPH_IDS]) if (!(id in results)) results[id] = false;
      strip.remove();
      sign.textContent = '⭐';
      mood(mon, 'dance', 0);
      confetti(el);
      app.audio.tone('fanfare');
      await app.audio.phrase('great_now_play');
      blending(results);
    }

    void (async () => {
      await app.audio.phrase('lets_see_sounds');
      void card();
    })();
  }

  // ----------------------------------------------------------- Quick Start
  function quickStart(): void {
    clear(body);
    el.classList.add('scroll');
    const sel = new Set<string>();
    const rows: { header: HTMLButtonElement; letters: { id: string; el: HTMLButtonElement }[] }[] = [];
    const grid = h('div', { class: 'qs-grid' });
    for (let s = 1; s <= MAX_SET; s++) {
      const gs = gpcsInSet(s);
      const header = h('button', { class: 'qs-set', type: 'button' }, `Set ${s}`);
      const letters = gs.map((g) => ({ id: g.id, el: h('button', { class: 'qs-letter', type: 'button' }, g.grapheme) }));
      header.addEventListener('click', () => {
        const all = gs.every((g) => sel.has(g.id));
        for (const g of gs) {
          if (all) sel.delete(g.id);
          else sel.add(g.id);
        }
        refresh();
      });
      for (const l of letters) {
        l.el.addEventListener('click', () => {
          if (sel.has(l.id)) sel.delete(l.id);
          else sel.add(l.id);
          refresh();
        });
      }
      rows.push({ header, letters });
      grid.appendChild(h('div', { class: 'qs-row' }, header, h('div', { class: 'qs-letters' }, letters.map((l) => l.el))));
    }
    const count = h('span', { class: 'pill' }, '0 sounds');
    function refresh(): void {
      for (const r of rows) {
        r.header.classList.toggle('sel', r.letters.every((l) => sel.has(l.id)));
        for (const l of r.letters) l.el.classList.toggle('sel', sel.has(l.id));
      }
      count.textContent = `${sel.size} sounds`;
    }
    body.append(
      h('div', { class: 'card', style: { maxWidth: '900px' } },
        h('div', { class: 'row' }, h('h2', {}, 'Tap the sounds she already knows'), h('div', { class: 'grow' }), count),
        h('p', { class: 'muted' }, '“Knows” = she says the sound (not the letter name) when she sees it. Tap a set name for the whole set, or single letters. Teach Your Monster’s First Steps covers sets 1–6. When in doubt leave it off — the game spots what she knows within a session or two.'),
        grid,
        h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '12px' } },
          h('button', { class: 'btn ghost small', type: 'button', onclick: chooser }, '◀ Back'),
          h('button', { class: 'btn green', type: 'button', onclick: () => {
            const r: Record<string, boolean> = {};
            for (const g of GPCS) r[g.id] = sel.has(g.id);
            blending(r);
          } }, 'Next ▶'),
        ),
      ),
    );
  }

  // -------------------------------------------------------------- Blending
  function blending(results: Record<string, boolean>): void {
    clear(body);
    el.classList.remove('scroll');
    const mon = h('div', { class: 'monster-wrap bob', style: { width: '150px', height: '150px' }, html: monsterSvg(app.profile.monster) });
    body.append(
      h('div', { class: 'card', style: { maxWidth: '760px' } },
        h('div', { class: 'row' }, mon, h('div', { class: 'grow' }, h('h2', {}, 'Last one, grown-up: can she blend a simple word?'), h('p', {}, 'Shown m‑u‑d, she says the three sounds and then “mud”.'))),
        h('div', { class: 'row', style: { justifyContent: 'center', gap: '16px' } },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => finish(results, 'no') }, 'Just starting'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => finish(results, 'sometimes') }, 'Sometimes'),
          h('button', { class: 'btn green', type: 'button', onclick: () => finish(results, 'yes') }, 'Yes, she can'),
        ),
      ),
    );
  }

  async function finish(results: Record<string, boolean>, blend: Blend, skipped = false): Promise<void> {
    if (!skipped) applyPlacement(app.profile, results, blend);
    else app.profile.placed = true;
    await app.save();
    app.go('home');
  }

  chooser();
  return el;
}
