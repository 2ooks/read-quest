// Sound Hunt — hear a sound, tap the letter (GraphoGame's core task).
// Also: First Sound — see/hear a letter, tap the picture that starts with it.
// And: Word Match — hear a word, tap the written word.
// And: Tricky Word — heart-word teaching + find it.

import { GPC_BY_ID } from '../../content/gpcs.ts';
import { TRICKY_BY_WORD } from '../../content/tricky.ts';
import type { Item } from '../../engine/composer.ts';
import { h, wait } from '../dom.ts';
import { sparkleAt } from '../feedback.ts';
import { bigWord, choiceRound, emojiFor, emojiTile, graphemesOf, letterTile, nextButton, speakerButton, wordTile, type GameCtx, type GameResult } from './common.ts';

export async function soundHunt(item: Extract<Item, { kind: 'soundHunt' }>, ctx: GameCtx): Promise<GameResult> {
  ctx.setPrompt('Tap the letter that makes this sound');
  const tiles = item.choices.map((id) => ({ id, el: letterTile(GPC_BY_ID[id].grapheme) }));
  ctx.stage.appendChild(h('div', { class: 'choices' }, tiles.map((t) => t.el)));
  return choiceRound({
    ctx,
    tiles,
    correctId: item.gpc,
    prompt: async () => { await ctx.audio.phrase('tap_the_sound'); await wait(150); await ctx.audio.sound(item.gpc); },
    replay: () => ctx.audio.sound(item.gpc),
    confirm: () => ctx.audio.sound(item.gpc),
  });
}

export async function firstSound(item: Extract<Item, { kind: 'firstSound' }>, ctx: GameCtx): Promise<GameResult> {
  ctx.setPrompt('Which picture starts with this sound?');
  const g = GPC_BY_ID[item.gpc];
  const letter = h('div', { class: 'letter-big', style: { fontSize: 'clamp(80px, 18vmin, 170px)' } }, g.grapheme);
  const tiles = item.choices.map((w) => ({ id: w, el: emojiTile(emojiFor(w) ?? '❓') }));
  ctx.stage.append(letter, h('div', { class: 'choices' }, tiles.map((t) => t.el)));
  const correct = item.choices.find((w) => {
    const first = graphemesOf(w)[0];
    return GPC_BY_ID[first]?.sapi === g.sapi;
  }) ?? item.choices[0];
  return choiceRound({
    ctx,
    tiles,
    correctId: correct,
    prompt: async () => { await ctx.audio.sound(item.gpc); await wait(120); await ctx.audio.phrase('which_starts'); },
    replay: () => ctx.audio.sound(item.gpc),
    onTap: (w) => ctx.audio.word(w),
    confirm: async () => { await ctx.audio.sound(item.gpc); await wait(80); await ctx.audio.word(correct); },
  });
}

export async function wordMatch(item: Extract<Item, { kind: 'wordMatch' }>, ctx: GameCtx): Promise<GameResult> {
  ctx.setPrompt('Find the word');
  const tiles = item.choices.map((w) => ({ id: w, el: wordTile(w) }));
  const emoji = emojiFor(item.word);
  const reveal = h('div', { class: 'emoji-big', style: { minHeight: '1em', opacity: '0' } }, emoji ?? '');
  ctx.stage.append(reveal, h('div', { class: 'choices' }, tiles.map((t) => t.el)));
  return choiceRound({
    ctx,
    tiles,
    correctId: item.word,
    prompt: async () => { await ctx.audio.phrase('find_word'); await wait(120); await ctx.audio.word(item.word); },
    replay: () => ctx.audio.word(item.word),
    confirm: async () => {
      if (emoji) {
        reveal.style.opacity = '1';
        reveal.classList.add('tile', 'pop');
        reveal.style.boxShadow = 'none';
        reveal.style.background = 'transparent';
        sparkleAt(reveal);
      }
      await ctx.audio.word(item.word);
    },
  });
}

export async function trickyWord(item: Extract<Item, { kind: 'tricky' }>, ctx: GameCtx): Promise<GameResult> {
  const t = TRICKY_BY_WORD[item.word.toLowerCase()];
  if (item.intro && t) {
    ctx.setPrompt('A heart word — we just remember the heart part');
    const { el } = bigWord(item.word, t.parts.map((p) => p.g), t.parts.map((p) => p.irregular));
    const holder = h('div', { class: 'stack' }, el);
    ctx.stage.appendChild(holder);
    const speaker = speakerButton(() => { void ctx.audio.word(item.word); });
    ctx.stage.appendChild(speaker);
    await ctx.audio.phrase('heart_word');
    await wait(150);
    await ctx.audio.word(item.word);
    await wait(200);
    await ctx.audio.phrase('say_it_with_me');
    await ctx.audio.word(item.word);
    await new Promise<void>((resolve) => {
      const next = nextButton(() => { next.remove(); resolve(); });
      ctx.stage.appendChild(next);
    });
    speaker.remove();
    holder.remove();
  }
  ctx.setPrompt('Find the tricky word');
  const tiles = item.choices.map((w) => ({ id: w, el: wordTile(w, TRICKY_BY_WORD[w.toLowerCase()] ? 'heart' : '') }));
  ctx.stage.appendChild(h('div', { class: 'choices' }, tiles.map((x) => x.el)));
  return choiceRound({
    ctx,
    tiles,
    correctId: item.word,
    prompt: async () => { await ctx.audio.phrase('find_tricky'); await wait(120); await ctx.audio.word(item.word); },
    replay: () => ctx.audio.word(item.word),
    confirm: () => ctx.audio.word(item.word),
  });
}
