// Read to me — the child reads aloud; the grown-up judges. This is the
// strongest evidence we get, and it is co-play by design.

import { TRICKY_BY_WORD } from '../../content/tricky.ts';
import type { Item } from '../../engine/composer.ts';
import { h, wait } from '../dom.ts';
import { sparkleAt } from '../feedback.ts';
import { bigWord, emojiFor, graphemesOf, praise, type GameCtx, type GameResult } from './common.ts';

export async function readToMe(item: Extract<Item, { kind: 'read' }>, ctx: GameCtx): Promise<GameResult> {
  const sentence = item.words.length > 1;
  ctx.setPrompt(sentence ? 'Read the sentence to your grown-up' : 'Read this to your grown-up');

  const hard = new Set<string>();
  let display: HTMLElement;
  const wordEls: Record<string, HTMLElement> = {};
  if (sentence) {
    const tokens = item.text.split(/\s+/);
    display = h('div', { class: 'sentence' });
    tokens.forEach((tok, i) => {
      const clean = tok.replace(/[.,!?]/g, '');
      const span = h('span', { class: 'w' }, tok);
      span.addEventListener('pointerdown', () => {
        if (hard.has(clean)) hard.delete(clean); else hard.add(clean);
        span.classList.toggle('hard', hard.has(clean));
      });
      wordEls[clean] = span;
      display.appendChild(span);
      if (i < tokens.length - 1) display.appendChild(document.createTextNode(' '));
    });
  } else {
    const t = TRICKY_BY_WORD[item.words[0].toLowerCase()];
    const gs = t ? t.parts.map((p) => p.g) : graphemesOf(item.words[0]);
    display = bigWord(item.words[0], gs, t ? t.parts.map((p) => p.irregular) : []).el;
  }
  const emoji = sentence ? undefined : emojiFor(item.words[0]);
  const reveal = h('div', { class: 'emoji-big', style: { minHeight: '1em', opacity: '0', transition: 'opacity 0.4s' } }, emoji ?? '');
  ctx.stage.append(reveal, display);

  let hinted = false;
  // The grown-up may tap before the prompt finishes — arm the buttons first.
  let finish: (how: 'yes' | 'helped') => void = () => undefined;
  const outcomePromise = new Promise<'yes' | 'helped'>((resolve) => { finish = resolve; });
  const model = async () => {
    hinted = true;
    if (sentence) await ctx.audio.words(item.words);
    else {
      await ctx.audio.blend(item.words[0], graphemesOf(item.words[0]));
      await wait(150);
      await ctx.audio.word(item.words[0]);
    }
  };

  const panel = h('div', { class: 'grownup' },
    h('div', { class: 'label' }, sentence ? 'Grown-up: tap any word she found hard, then choose' : 'Grown-up: how did it go?'),
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => { void model(); } }, '🔊 Model it'),
    h('button', { class: 'btn yellow small', type: 'button', onclick: () => finish('helped') }, '🤝 We did it together'),
    h('button', { class: 'btn green', type: 'button', onclick: () => finish('yes') }, '✓ She read it!'),
  );
  ctx.stage.appendChild(panel);

  const start = performance.now();
  void ctx.audio.phrase(sentence ? 'read_sentence' : 'read_to_grownup');

  const outcome = await outcomePromise;
  ctx.audio.stopAll();
  const ms = performance.now() - start;
  panel.remove();

  const words: Record<string, boolean> = {};
  for (const w of item.words) words[w] = outcome === 'yes' && !hard.has(w);
  const allGood = Object.values(words).every(Boolean);

  if (outcome === 'yes') {
    ctx.audio.tone('yes');
    ctx.react(allGood ? 'party' : 'yes');
    sparkleAt(display);
    if (emoji) { reveal.style.opacity = '1'; reveal.classList.add('pop'); }
    for (const [w, ok] of Object.entries(words)) if (!ok) wordEls[w]?.classList.add('hard');
    await ctx.audio.phrase(allGood ? praise() : 'nice_reading');
    if (!sentence) await ctx.audio.word(item.words[0]);
  } else {
    // model – lead – test
    await ctx.audio.phrase('lets_try_together');
    await model();
    await wait(200);
    await ctx.audio.phrase('your_turn');
    await new Promise<void>((resolve) => {
      const done = h('button', { class: 'btn green', type: 'button', onclick: () => { done.remove(); resolve(); } }, '✓ Done');
      ctx.stage.appendChild(done);
    });
    if (emoji) { reveal.style.opacity = '1'; }
    await ctx.audio.phrase('nice_reading');
  }
  await wait(300);
  return { correct: allGood, ms, hinted, scored: true, words };
}
