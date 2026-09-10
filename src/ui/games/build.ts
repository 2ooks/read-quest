// Word Builder — Elkonin-style sound boxes. Hear the word, tap letter tiles
// into the boxes in order (tap, not drag: drag is hard under five).

import { GPC_BY_ID } from '../../content/gpcs.ts';
import type { Item } from '../../engine/composer.ts';
import { h, wait } from '../dom.ts';
import { sparkleAt } from '../feedback.ts';
import { emojiFor, graphemesOf, praise, speakerButton, type GameCtx, type GameResult } from './common.ts';

export async function wordBuilder(item: Extract<Item, { kind: 'build' }>, ctx: GameCtx): Promise<GameResult> {
  const target = graphemesOf(item.word);
  const emoji = emojiFor(item.word);
  ctx.setPrompt('Build the word');

  const picture = h('div', { class: 'emoji-big', style: { fontSize: 'clamp(56px, 12vmin, 120px)', minHeight: '1em' } }, emoji ?? '🔊');
  const slots = target.map(() => h('button', { class: 'tile small slot', type: 'button' }, ''));
  const tray = item.tiles.map((g, i) => ({ g, el: h('button', { class: 'tile small', type: 'button', dataset: { i: String(i) } }, GPC_BY_ID[g]?.grapheme ?? g) }));
  const slotRow = h('div', { class: 'choices', style: { gap: '10px' } }, slots);
  const trayRow = h('div', { class: 'choices', style: { gap: '14px' } }, tray.map((t) => t.el));
  ctx.stage.append(picture, slotRow, trayRow);
  const hear = async () => { await ctx.audio.word(item.word); };
  const speaker = speakerButton(hear);
  ctx.stage.appendChild(speaker);

  // placed[i] = index into tray, or -1
  const placed: number[] = target.map(() => -1);
  const firstAttempt: (boolean | null)[] = target.map(() => null);
  let attempts = 0;
  let hinted = false;
  let start = performance.now();
  let firstMs = 0;

  const nextEmpty = () => placed.findIndex((p) => p < 0);
  const refresh = () => {
    slots.forEach((s, i) => {
      const p = placed[i];
      s.textContent = p >= 0 ? (GPC_BY_ID[tray[p].g]?.grapheme ?? tray[p].g) : '';
      s.classList.toggle('filled', p >= 0);
    });
    tray.forEach((t, i) => t.el.classList.toggle('used', placed.includes(i)));
  };

  // Play the prompt without blocking: she may already know the word from the picture.
  void (async () => {
    await ctx.audio.phrase('build_word');
    await wait(120);
    await hear();
    if (firstMs === 0) start = performance.now();
  })();

  const result = await new Promise<GameResult>((resolve) => {
    const showHint = () => {
      const i = nextEmpty();
      if (i < 0) return;
      tray.forEach((t) => t.el.classList.remove('hint'));
      const want = target[i];
      const cand = tray.find((t, idx) => t.g === want && !placed.includes(idx));
      cand?.el.classList.add('hint');
    };

    const check = async () => {
      attempts++;
      const wrong: number[] = [];
      placed.forEach((p, i) => {
        const ok = tray[p].g === target[i];
        if (firstAttempt[i] === null) firstAttempt[i] = ok;
        if (!ok) wrong.push(i);
      });
      if (!wrong.length) {
        slots.forEach((s) => s.classList.add('right'));
        ctx.audio.tone('yes');
        sparkleAt(slotRow);
        await ctx.audio.blend(item.word, target);
        await wait(100);
        await ctx.audio.word(item.word);
        const allFirst = firstAttempt.every((x) => x === true);
        await ctx.audio.phrase(allFirst ? praise() : 'thats_it');
        await wait(300);
        speaker.remove();
        resolve({
          correct: allFirst,
          ms: firstMs,
          hinted,
          scored: true,
          parts: target.map((g, i) => ({ gpc: g, correct: firstAttempt[i] === true })),
        });
        return;
      }
      ctx.audio.tone('no');
      wrong.forEach((i) => slots[i].classList.add('bad', 'wobble'));
      await wait(700);
      wrong.forEach((i) => {
        slots[i].classList.remove('bad', 'wobble');
        placed[i] = -1;
      });
      refresh();
      await ctx.audio.phrase('listen_again');
      await ctx.audio.blend(item.word, target);
      if (attempts >= 2) {
        hinted = true;
        showHint();
      }
    };

    tray.forEach((t, idx) => {
      t.el.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        if (placed.includes(idx)) return;
        const i = nextEmpty();
        if (i < 0) return;
        if (firstMs === 0) firstMs = performance.now() - start;
        placed[i] = idx;
        t.el.classList.remove('hint');
        refresh();
        ctx.audio.tone('tap');
        void ctx.audio.sound(t.g);
        if (nextEmpty() < 0) {
          await wait(350);
          await check();
        } else if (hinted) showHint();
      });
    });
    slots.forEach((s, i) => {
      s.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (placed[i] >= 0) {
          // take it back
          placed[i] = -1;
          refresh();
          ctx.audio.tone('tap');
        } else {
          void ctx.audio.blend(item.word, target);
        }
      });
    });
  });
  return result;
}
