// Intro Sound (teach a new letter-sound) and Blend & Reveal (model connected
// blending: tap the letters in order, hear "mmmuuud", say it fast → picture).

import { GPC_BY_ID } from '../../content/gpcs.ts';
import type { Item } from '../../engine/composer.ts';
import { awaitTap, h, wait } from '../dom.ts';
import { sparkleAt } from '../feedback.ts';
import { cueFor, emojiFor, graphemesOf, nextButton, speakerButton, type GameCtx, type GameResult } from './common.ts';

function waitNext(ctx: GameCtx, autoMs = 0): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      next.remove();
      resolve();
    };
    const next = nextButton(finish);
    ctx.stage.appendChild(next);
    if (autoMs) setTimeout(finish, autoMs);
  });
}

export async function introSound(item: Extract<Item, { kind: 'intro' }>, ctx: GameCtx): Promise<GameResult> {
  const g = GPC_BY_ID[item.gpc];
  const cue = cueFor(item.gpc);
  ctx.setPrompt('A new sound!');
  const letter = h('div', { class: 'letter-big pop' }, g.grapheme);
  const cueEl = h('div', { class: 'row', style: { opacity: '0', transition: 'opacity 0.4s', alignItems: 'center', gap: '18px' } },
    h('div', { class: 'emoji-big', style: { fontSize: 'clamp(60px, 12vmin, 120px)' } }, cue.emoji),
    h('div', { class: 'bigword', style: { fontSize: 'clamp(40px, 8vmin, 80px)' } }, ...graphemesOf(cue.word).map((x, i) => h('span', { class: `g ${GPC_BY_ID[x]?.sapi === g.sapi && i === 0 ? 'lit' : ''}` }, x))),
  );
  ctx.stage.append(letter, cueEl);
  const speaker = speakerButton(() => { void ctx.audio.sound(item.gpc); });
  ctx.stage.appendChild(speaker);

  await ctx.audio.phrase('new_sound');
  await wait(150);
  await ctx.audio.sound(item.gpc);
  await wait(250);
  await ctx.audio.sound(item.gpc);
  cueEl.style.opacity = '1';
  await wait(200);
  await ctx.audio.word(cue.word);
  await wait(300);
  await ctx.audio.phrase('say_it_with_me');
  letter.classList.add('pop');
  await ctx.audio.sound(item.gpc);
  await wait(900);
  await ctx.audio.sound(item.gpc);
  await waitNext(ctx);
  speaker.remove();
  return { correct: true, ms: 0, hinted: false, scored: false };
}

export async function blendReveal(item: Extract<Item, { kind: 'blend' }>, ctx: GameCtx): Promise<GameResult> {
  const graphemes = graphemesOf(item.word);
  const emoji = emojiFor(item.word);
  ctx.setPrompt('Tap the letters in order, then say it fast!');
  const tiles = graphemes.map((g) => h('button', { class: 'tile', type: 'button' }, g));
  const row = h('div', { class: 'choices', style: { gap: 'clamp(24px, 6vmin, 60px)', transition: 'gap 0.5s ease' } }, tiles);
  const reveal = h('div', { class: 'emoji-big', style: { minHeight: '1em', opacity: '0', transition: 'opacity 0.4s' } }, emoji ?? '⭐');
  ctx.stage.append(reveal, row);
  const speaker = speakerButton(async () => { await ctx.audio.blend(item.word, graphemes); await wait(150); await ctx.audio.word(item.word); });
  ctx.stage.appendChild(speaker);

  await ctx.audio.phrase('tap_letters_in_order');
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].classList.add('hint');
    // Only the next letter is live; taps elsewhere are ignored.
    await awaitTap([tiles[i]], performance.now(), 0);
    tiles[i].classList.remove('hint');
    tiles[i].classList.add('right');
    ctx.audio.tone('tap');
    await ctx.audio.sound(graphemes[i]);
  }
  await wait(300);
  row.style.gap = '4px';
  await wait(500);
  await ctx.audio.blend(item.word, graphemes);
  await wait(200);
  await ctx.audio.phrase('say_it_fast');
  await wait(700);
  await ctx.audio.word(item.word);
  reveal.style.opacity = '1';
  reveal.classList.add('pop');
  sparkleAt(reveal);
  ctx.audio.tone('yes');
  ctx.react('party');
  await wait(600);
  await waitNext(ctx, 7000);
  speaker.remove();
  return { correct: true, ms: 0, hinted: false, scored: false };
}
