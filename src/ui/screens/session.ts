// Session runner: composes items lazily, runs each mini-game, applies the
// evidence to the learner model, saves after every item.

import type { App } from '../../app.ts';
import { GPC_BY_ID } from '../../content/gpcs.ts';
import { TRICKY_BY_WORD } from '../../content/tricky.ts';
import { WORD_BY_SPELLING } from '../../content/words.ts';
import { newSession, nextItem, noteMiss, type Item, type SessionCtx } from '../../engine/composer.ts';
import { introduceGpc, introduceTricky, log, recordGpc, recordTricky, recordWord, updateStair } from '../../engine/observe.ts';
import { clipIdForBlend, clipIdForSound, clipIdForWord } from '../../audio/clips.ts';
import { h, holdButton, clear } from '../dom.ts';
import { monsterSvg } from '../monster.ts';
import { blendReveal, introSound } from '../games/blend.ts';
import { wordBuilder } from '../games/build.ts';
import { firstSound, soundHunt, trickyWord, wordMatch } from '../games/choice.ts';
import { readToMe } from '../games/read.ts';
import type { GameCtx, GameResult } from '../games/common.ts';

export function sessionScreen(app: App, params: Record<string, unknown>): HTMLElement {
  const coPlay = params.coPlay !== false;
  const profile = app.profile;
  const el = h('div', { class: 'screen' });
  const ctx: SessionCtx = newSession(profile, coPlay);
  const startedAt = Date.now();
  let correctCount = 0;
  let scoredCount = 0;
  let cancelled = false;

  const dots = Array.from({ length: ctx.total }, () => h('span', { class: 'dot' }));
  const progress = h('div', { class: 'progress' }, dots);
  const prompt = h('div', { class: 'prompt' });
  const mini = h('div', { class: 'monster-wrap small', html: monsterSvg(profile.monster) });
  const exit = holdButton('✕', () => { cancelled = true; app.go('home'); }, 'Stop (hold)');
  el.append(h('div', { class: 'topbar' }, mini, h('div', { class: 'grow' }, progress), exit), prompt);
  const stage = h('div', { class: 'stage', style: { position: 'relative' } });
  el.appendChild(stage);

  const gctx: GameCtx = {
    stage,
    audio: app.audio,
    profile,
    setPrompt: (t) => { prompt.textContent = t; },
  };

  async function run(): Promise<void> {
    let item: Item | null;
    let i = 0;
    while (!cancelled && (item = nextItem(profile, ctx))) {
      dots[i]?.classList.add('now');
      clear(stage);
      preload(item);
      exposeForDebug(item);
      let result: GameResult;
      try {
        result = await play(item, gctx);
      } catch (err) {
        console.error(err);
        result = { correct: true, ms: 0, hinted: false, scored: false };
      }
      if (cancelled) return;
      apply(item, result);
      dots[i]?.classList.remove('now');
      dots[i]?.classList.add(result.scored && !result.correct ? 'miss' : 'done');
      if (result.scored) {
        scoredCount++;
        if (result.correct) correctCount++;
        if (!result.correct) noteMiss(ctx, item);
      }
      i++;
      await app.save();
    }
    if (cancelled) return;
    const minutes = (Date.now() - startedAt) / 60000;
    profile.sessions.push({ at: startedAt, items: ctx.total, correct: correctCount, minutes: Math.round(minutes * 10) / 10, newGpc: ctx.newGpc });
    await app.save();
    app.go('complete', { correct: correctCount, scored: scoredCount });
  }

  function preload(item: Item): void {
    const ids: string[] = [];
    if ('gpc' in item) ids.push(clipIdForSound(item.gpc));
    if (item.kind === 'soundHunt') for (const c of item.choices) ids.push(clipIdForSound(c));
    if ('word' in item) ids.push(clipIdForWord(item.word), clipIdForBlend(item.word));
    if ('words' in item) for (const w of item.words) ids.push(clipIdForWord(w));
    if (item.kind === 'firstSound' || item.kind === 'wordMatch' || item.kind === 'tricky') for (const c of item.choices) ids.push(clipIdForWord(c));
    if (item.kind === 'build') for (const t of item.tiles) ids.push(clipIdForSound(t));
    void app.audio.preload(ids);
  }

  function play(item: Item, g: GameCtx): Promise<GameResult> {
    switch (item.kind) {
      case 'intro': return introSound(item, g);
      case 'soundHunt': return soundHunt(item, g);
      case 'firstSound': return firstSound(item, g);
      case 'blend': return blendReveal(item, g);
      case 'build': return wordBuilder(item, g);
      case 'wordMatch': return wordMatch(item, g);
      case 'read': return readToMe(item, g);
      case 'tricky': return trickyWord(item, g);
    }
  }

  function apply(item: Item, r: GameResult): void {
    const now = Date.now();
    switch (item.kind) {
      case 'intro':
        introduceGpc(profile, item.gpc, now);
        break;
      case 'blend':
        log(profile, 'blend', item.word, true, 0, false, now);
        break;
      case 'soundHunt':
        recordGpc(profile, item.gpc, r.correct, item.choices.length, r.ms, now);
        updateStair(profile, 'soundHunt', r.correct);
        break;
      case 'firstSound':
        recordGpc(profile, item.gpc, r.correct, item.choices.length, r.ms, now);
        updateStair(profile, 'firstSound', r.correct);
        break;
      case 'build':
        for (const p of r.parts ?? []) recordGpc(profile, p.gpc, p.correct, item.tiles.length, r.ms, now);
        recordWord(profile, 'build', item.word, r.correct, 0, r.ms, now);
        updateStair(profile, 'build', r.correct);
        break;
      case 'wordMatch':
        recordWord(profile, 'match', item.word, r.correct, item.choices.length, r.ms, now);
        updateStair(profile, 'wordMatch', r.correct);
        break;
      case 'read':
        for (const [w, ok] of Object.entries(r.words ?? {})) {
          if (TRICKY_BY_WORD[w.toLowerCase()] && !WORD_BY_SPELLING[w.toLowerCase()]) recordTricky(profile, TRICKY_BY_WORD[w.toLowerCase()].w, ok, 0, r.ms, now);
          else if (WORD_BY_SPELLING[w.toLowerCase()]) recordWord(profile, 'read', WORD_BY_SPELLING[w.toLowerCase()].w, ok, 0, r.ms, now);
        }
        break;
      case 'tricky':
        if (item.intro) introduceTricky(profile, item.word, now);
        recordTricky(profile, item.word, r.correct, item.choices.length, r.ms, now);
        updateStair(profile, 'tricky', r.correct);
        break;
    }
    if (r.hinted) log(profile, 'hint', 'gpc' in item ? GPC_BY_ID[item.gpc]?.id ?? '' : 'word' in item ? item.word : item.kind, false, 0, true, now);
  }

  void run();
  return el;
}

/** Debug/test hook: window.__rq = { item, answer } for the current activity. */
function exposeForDebug(item: Item): void {
  let answer: unknown = null;
  switch (item.kind) {
    case 'soundHunt': answer = GPC_BY_ID[item.gpc]?.grapheme; break;
    case 'firstSound': {
      const g = GPC_BY_ID[item.gpc];
      const w = item.choices.find((c) => GPC_BY_ID[WORD_BY_SPELLING[c.toLowerCase()]?.g[0] ?? '']?.sapi === g?.sapi) ?? item.choices[0];
      answer = WORD_BY_SPELLING[w.toLowerCase()]?.emoji ?? w;
      break;
    }
    case 'wordMatch': case 'tricky': answer = item.word; break;
    case 'build': answer = (WORD_BY_SPELLING[item.word.toLowerCase()]?.g ?? []).map((g) => GPC_BY_ID[g]?.grapheme ?? g); break;
    case 'blend': answer = (WORD_BY_SPELLING[item.word.toLowerCase()]?.g ?? []).map((g) => GPC_BY_ID[g]?.grapheme ?? g); break;
    default: answer = null;
  }
  (window as unknown as { __rq: unknown; __rqLog: unknown[] }).__rq = { item, answer };
  const w = window as unknown as { __rqLog?: unknown[] };
  (w.__rqLog ??= []).push({ t: Date.now(), kind: item.kind, answer });
}
