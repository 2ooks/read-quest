// Shared plumbing for mini-games.

import type { AudioPlayer } from '../../audio/audio.ts';
import { GPC_BY_ID } from '../../content/gpcs.ts';
import type { PhraseId } from '../../content/phrases.ts';
import { WORD_BY_SPELLING } from '../../content/words.ts';
import type { Profile } from '../../engine/state.ts';
import { awaitTap, h, iconButton, wait } from '../dom.ts';
import { sparkleAt } from '../feedback.ts';

export interface GameResult {
  /** Was the FIRST unaided response correct? */
  correct: boolean;
  /** Latency of the first response in ms (0 if n/a). */
  ms: number;
  hinted: boolean;
  /** Whether this item should update the learner model at all. */
  scored: boolean;
  /** Per-grapheme results for Word Builder. */
  parts?: { gpc: string; correct: boolean }[];
  /** Per-word results for Read-to-me sentences. */
  words?: Record<string, boolean>;
}

export interface GameCtx {
  stage: HTMLElement;
  audio: AudioPlayer;
  profile: Profile;
  /** Called when the child needs to move on (e.g. Next button). */
  setPrompt(text: string): void;
}

export const PRAISE: PhraseId[] = ['yes', 'great', 'thats_it', 'brilliant', 'you_did_it'];

export function praise(): PhraseId {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function letterTile(grapheme: string, extra = ''): HTMLButtonElement {
  return h('button', { class: `tile ${extra}`, type: 'button' }, grapheme);
}

export function emojiTile(emoji: string, extra = ''): HTMLButtonElement {
  return h('button', { class: `tile emoji ${extra}`, type: 'button' }, emoji);
}

export function wordTile(word: string, extra = ''): HTMLButtonElement {
  return h('button', { class: `tile word ${extra}`, type: 'button' }, word);
}

export function emojiFor(spelling: string): string | undefined {
  return WORD_BY_SPELLING[spelling.toLowerCase()]?.emoji;
}

export function graphemesOf(spelling: string): string[] {
  return WORD_BY_SPELLING[spelling.toLowerCase()]?.g ?? spelling.split('');
}

/** A big word rendered grapheme by grapheme so we can light them up. */
export function bigWord(spelling: string, graphemes: string[], irregular: boolean[] = []): { el: HTMLElement; parts: HTMLElement[] } {
  const parts = graphemes.map((g, i) => h('span', { class: `g ${irregular[i] ? 'irr' : ''}` }, i === 0 && spelling[0] === spelling[0].toUpperCase() && spelling[0] !== spelling[0].toLowerCase() ? g.charAt(0).toUpperCase() + g.slice(1) : g));
  return { el: h('div', { class: 'bigword' }, parts), parts };
}

export function speakerButton(onClick: () => void): HTMLButtonElement {
  return iconButton('🔊', onClick, 'Hear it again', 'large speaker');
}

export function nextButton(onClick: () => void): HTMLButtonElement {
  return iconButton('▶', onClick, 'Next', 'large next');
}

export interface ChoiceOpts<T extends HTMLButtonElement> {
  ctx: GameCtx;
  tiles: { el: T; id: string }[];
  correctId: string;
  /** Plays the full prompt (instruction + target). */
  prompt: () => Promise<void>;
  /** Replays just the target (after a miss). */
  replay: () => Promise<void>;
  /** Plays when a tile is tapped, before judging (e.g. naming a picture). */
  onTap?: (id: string) => Promise<void>;
  /** Confirmation after the correct tile is tapped. */
  confirm: () => Promise<void>;
}

/**
 * The shared multiple-choice loop. First tap is scored; misses dim the tile
 * and replay the target; after two misses the right answer pulses (hint).
 * The child always ends by tapping the right answer.
 */
export async function choiceRound<T extends HTMLButtonElement>(o: ChoiceOpts<T>): Promise<GameResult> {
  const { ctx } = o;
  const speaker = speakerButton(() => { void o.replay(); });
  ctx.stage.appendChild(speaker);
  // Tiles look "asleep" until the prompt has been heard.
  const choiceBox = o.tiles[0]?.el.parentElement;
  choiceBox?.classList.add('waiting');
  await o.prompt();
  choiceBox?.classList.remove('waiting');
  let start = performance.now();
  let attempts = 0;
  let firstMs = 0;
  let firstCorrect = false;
  let hinted = false;
  const live = () => o.tiles.filter((t) => !t.el.classList.contains('dim')).map((t) => t.el);

  for (;;) {
    const { el, ms } = await awaitTap(live(), start);
    const tapped = o.tiles.find((t) => t.el === el)!;
    if (attempts === 0) firstMs = ms;
    attempts++;
    if (o.onTap) await o.onTap(tapped.id);
    if (tapped.id === o.correctId) {
      if (attempts === 1) firstCorrect = true;
      el.classList.remove('hint');
      el.classList.add('right', 'pop');
      ctx.audio.tone('yes');
      sparkleAt(el);
      for (const t of o.tiles) if (t.el !== el) t.el.classList.add('dim');
      await o.confirm();
      if (firstCorrect) await ctx.audio.phrase(praise());
      else await ctx.audio.phrase('thats_it');
      await wait(350);
      speaker.remove();
      return { correct: firstCorrect, ms: firstMs, hinted, scored: true };
    }
    // miss
    ctx.audio.tone('no');
    el.classList.add('wobble');
    await wait(450);
    el.classList.remove('wobble');
    el.classList.add('dim');
    if (attempts >= 2) {
      hinted = true;
      o.tiles.find((t) => t.id === o.correctId)!.el.classList.add('hint');
    }
    await ctx.audio.phrase('listen_again');
    await o.replay();
    start = performance.now();
    if (live().length <= 1) {
      // Only the right one is left; make sure it's obvious.
      hinted = true;
      o.tiles.find((t) => t.id === o.correctId)!.el.classList.add('hint');
    }
  }
}

export function cueFor(gpcId: string): { word: string; emoji: string } {
  const g = GPC_BY_ID[gpcId];
  return { word: g?.cue ?? gpcId, emoji: g?.cueEmoji ?? '✨' };
}
