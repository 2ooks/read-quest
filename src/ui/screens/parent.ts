// Grown-ups area: progress heatmap, recording studio, settings, data.

import type { App } from '../../app.ts';
import { GPCS, MAX_SET } from '../../content/gpcs.ts';
import { PHRASES, type PhraseId } from '../../content/phrases.ts';
import { TRICKY } from '../../content/tricky.ts';
import { UNIQUE_WORDS } from '../../content/words.ts';
import { clipIdForBlend, clipIdForPhrase, clipIdForSound, clipIdForWord } from '../../audio/clips.ts';
import { Recorder, cleanRecording } from '../../audio/recorder.ts';
import { BKT } from '../../engine/bkt.ts';
import { currentSet, eligibleWords, isMastered, knownGpcs, makeSentence } from '../../engine/decodable.ts';
import { isDue } from '../../engine/scheduler.ts';
import { migrateProfile, type KcState } from '../../engine/state.ts';
import { db } from '../../storage/db.ts';
import { h, clear } from '../dom.ts';

type Tab = 'progress' | 'sounds' | 'settings' | 'data';

export function parentScreen(app: App, params: Record<string, unknown>): HTMLElement {
  const el = h('div', { class: 'screen scroll' });
  const body = h('div', { class: 'parent' });
  let tab: Tab = (params.tab as Tab) ?? 'progress';

  const tabs = h('div', { class: 'tabs' });
  const render = () => {
    clear(tabs);
    for (const [id, label] of [['progress', '📈 Progress'], ['sounds', '🎙️ Your voice'], ['settings', '⚙️ Settings'], ['data', '💾 Data']] as [Tab, string][]) {
      tabs.appendChild(h('button', { class: `tab ${tab === id ? 'sel' : ''}`, type: 'button', onclick: () => { tab = id; render(); } }, label));
    }
    clear(body);
    body.appendChild(tabs);
    switch (tab) {
      case 'progress': body.appendChild(progressTab(app)); break;
      case 'sounds': body.appendChild(soundsTab(app)); break;
      case 'settings': body.appendChild(settingsTab(app)); break;
      case 'data': body.appendChild(dataTab(app, render)); break;
    }
  };
  render();

  el.append(
    h('div', { class: 'topbar' }, h('h1', {}, 'Grown-ups'), h('div', { class: 'grow' }), h('button', { class: 'btn green', type: 'button', onclick: () => app.go('home') }, 'Back to game')),
    body,
  );
  return el;
}

// ------------------------------------------------------------- progress

function colorFor(kc: KcState | undefined): string {
  if (!kc || !kc.intro) return '#f1edfa';
  const p = kc.p;
  if (isMastered(p, kc.days)) return '#b8f0c6';
  if (p >= BKT.READY) return '#dff7e5';
  if (p >= 0.5) return '#fff1c2';
  return '#ffd9d3';
}

function progressTab(app: App): HTMLElement {
  const p = app.profile;
  const now = Date.now();
  const wrap = h('div');
  const known = knownGpcs(p);
  const words = eligibleWords(p);
  const mastered = GPCS.filter((g) => isMastered(p.gpc[g.id].p, p.gpc[g.id].days)).length;
  const due = [...GPCS.map((g) => ({ id: g.grapheme, kc: p.gpc[g.id] })), ...TRICKY.map((t) => ({ id: t.w, kc: p.tricky[t.w] }))].filter((x) => x.kc && isDue(x.kc, now));
  const sessions = p.sessions.slice(-14).reverse();
  const acc = p.sessions.length ? Math.round((100 * p.sessions.reduce((a, s) => a + s.correct, 0)) / Math.max(1, p.sessions.reduce((a, s) => a + s.items, 0))) : 0;

  wrap.append(
    h('div', { class: 'row', style: { gap: '10px', marginBottom: '10px' } },
      pill(`${p.sessions.length} sessions`), pill(`${known.size} sounds ready`), pill(`${mastered} mastered`), pill(`${words.length} words she can decode`),
      pill(`Set ${currentSet(p)} of ${MAX_SET}`), pill(`Reading level θ ${p.elo.read.theta.toFixed(2)}`), pill(`~${acc}% correct overall`),
    ),
    h('p', { class: 'muted' }, 'Each cell is a letter-sound. Colour = how sure the model is that she knows it (red → yellow → green; bright green = mastered on two different days). ⚡ marks sounds she answers fast and accurately.'),
    h('div', { class: 'legend' }, legend('#ffd9d3', 'learning'), legend('#fff1c2', 'getting there'), legend('#dff7e5', 'ready'), legend('#b8f0c6', 'mastered'), legend('#f1edfa', 'not yet introduced')),
  );
  for (let s = 1; s <= MAX_SET; s++) {
    wrap.appendChild(h('div', { class: 'setname' }, `Set ${s}`));
    const grid = h('div', { class: 'grid-gpc' });
    for (const g of GPCS.filter((x) => x.set === s)) {
      const kc = p.gpc[g.id];
      const auto = kc && kc.n >= 3 && kc.fast / Math.max(1, kc.c) > 0.6 && kc.p >= BKT.READY;
      grid.appendChild(h('div', { class: `cell ${kc?.intro ? '' : 'locked'}`, style: { background: colorFor(kc) }, title: `p(known)=${kc?.p.toFixed(2)} attempts=${kc?.n}` },
        g.grapheme, h('small', {}, kc?.intro ? `${Math.round(kc.p * 100)}%` : '—'), auto ? h('span', { class: 'auto' }, '⚡') : null));
    }
    wrap.appendChild(grid);
  }
  wrap.appendChild(h('div', { class: 'setname' }, 'Tricky (heart) words'));
  const tg = h('div', { class: 'grid-gpc' });
  for (const t of TRICKY) {
    const kc = p.tricky[t.w];
    tg.appendChild(h('div', { class: `cell ${kc?.intro ? '' : 'locked'}`, style: { background: colorFor(kc), fontSize: '18px' } }, t.w, h('small', {}, kc?.intro ? `${Math.round(kc.p * 100)}%` : '—')));
  }
  wrap.appendChild(tg);

  if (due.length) {
    wrap.appendChild(h('div', { class: 'setname' }, `Due for review (${due.length})`));
    wrap.appendChild(h('p', {}, due.map((d) => d.id).join('  ·  ')));
  }

  const wordRows = Object.entries(p.words).sort((a, b) => (b[1].n - b[1].c) - (a[1].n - a[1].c)).slice(0, 12);
  if (wordRows.length) {
    wrap.appendChild(h('div', { class: 'setname' }, 'Words she has worked hardest on'));
    wrap.appendChild(h('table', { class: 'plain' }, h('tbody', {}, wordRows.map(([w, s]) => h('tr', {}, h('td', {}, w), h('td', {}, `${s.c}/${s.n} right`), h('td', {}, `difficulty ${s.b.toFixed(2)}`))))));
  }

  wrap.appendChild(h('div', { class: 'setname' }, 'Recent sessions'));
  wrap.appendChild(h('table', { class: 'plain' },
    h('thead', {}, h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Items'), h('th', {}, 'First-try correct'), h('th', {}, 'Minutes'), h('th', {}, 'New sound'))),
    h('tbody', {}, sessions.length ? sessions.map((s) => h('tr', {}, h('td', {}, new Date(s.at).toLocaleString()), h('td', {}, String(s.items)), h('td', {}, String(s.correct)), h('td', {}, String(s.minutes)), h('td', {}, s.newGpc ?? '—'))) : h('tr', {}, h('td', { colspan: '5' }, 'No sessions yet'))),
  ));

  wrap.appendChild(h('div', { class: 'setname' }, 'Tonight'));
  wrap.appendChild(h('div', { class: 'row' },
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => app.go('print') }, '🖨️ Print sentences she can read'),
    h('span', { class: 'muted' }, 'Five decodable sentences built only from what she knows — for the sofa, not the screen.'),
  ));
  return wrap;
}

function pill(text: string): HTMLElement {
  return h('span', { class: 'pill' }, text);
}
function legend(color: string, text: string): HTMLElement {
  return h('span', {}, h('i', { style: { background: color } }), text);
}

// --------------------------------------------------------------- sounds

function soundsTab(app: App): HTMLElement {
  const wrap = h('div');
  const supported = Recorder.supported();
  const rec = new Recorder();
  let ready = false;

  const recorded = () => [...GPCS.map((g) => clipIdForSound(g.id))].filter((id) => app.audio.hasRecording(id)).length;
  const status = h('span', { class: 'pill' }, `${recorded()} / ${GPCS.length} sounds in your voice`);

  wrap.append(
    h('h2', {}, 'Record the sounds in your own voice'),
    h('p', {}, 'The built-in voice is a computer voice. Children learn best from a familiar voice saying pure sounds — and it takes about five minutes. Press and hold a button, say the sound, let go. Tap ▶ to check it, or ✕ to remove it and fall back to the built-in clip.'),
    h('p', { class: 'muted' }, 'Tips: stretch the continuous sounds (“mmmm”, “ssss”), clip the stop sounds short (“t”, “p”, “k” — no “uh”), and say only the short vowel (“a” as in apple).'),
    h('div', { class: 'row' }, status),
  );
  if (!supported) {
    wrap.appendChild(h('p', { style: { color: '#b00' } }, 'This browser cannot record audio. On iPad, use Safari and allow the microphone.'));
    return wrap;
  }

  const section = (title: string, rows: { id: string; label: string; tip: string; fallbackText: string }[]) => {
    wrap.appendChild(h('div', { class: 'setname' }, title));
    for (const r of rows) {
      const btn = h('button', { class: `rec-btn ${app.audio.hasRecording(r.id) ? 'has' : ''}`, type: 'button' }, app.audio.hasRecording(r.id) ? '● Re-record' : '● Hold to record');
      const play = h('button', { class: 'icon-btn', type: 'button', style: { width: '48px', height: '48px', fontSize: '20px' }, onclick: () => { void app.audio.play(r.id, r.fallbackText); } }, '▶');
      const del = h('button', { class: 'icon-btn', type: 'button', style: { width: '48px', height: '48px', fontSize: '18px' }, onclick: async () => { await app.audio.removeRecording(r.id); btn.classList.remove('has'); btn.textContent = '● Hold to record'; status.textContent = `${recorded()} / ${GPCS.length} sounds in your voice`; } }, '✕');
      let recording = false;
      const start = async (e: Event) => {
        e.preventDefault();
        if (recording) return;
        try {
          if (!ready) { await rec.prepare(); ready = true; }
          recording = true;
          btn.classList.add('on');
          btn.textContent = '● Recording…';
          rec.start();
        } catch {
          btn.textContent = 'Mic blocked';
        }
      };
      const stop = async (e: Event) => {
        e.preventDefault();
        if (!recording) return;
        recording = false;
        btn.classList.remove('on');
        try {
          const raw = await rec.stop();
          await app.audio.init();
          const ctx = app.audio.context!;
          const clean = await cleanRecording(raw, ctx);
          await app.audio.setRecording(r.id, clean);
          btn.classList.add('has');
          btn.textContent = '● Re-record';
          status.textContent = `${recorded()} / ${GPCS.length} sounds in your voice`;
          void app.audio.play(r.id);
        } catch (err) {
          console.error(err);
          btn.textContent = 'Try again';
        }
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointercancel', stop);
      btn.addEventListener('pointerleave', (e) => { if (recording) void stop(e); });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      wrap.appendChild(h('div', { class: 'studio-row' }, h('div', { class: 'g' }, r.label), h('div', { class: 'tip' }, r.tip), play, btn, del));
    }
  };

  section('Letter sounds (most important)', GPCS.map((g) => ({ id: clipIdForSound(g.id), label: g.grapheme, tip: `${g.tip} (as in ${g.cue})`, fallbackText: g.cue })));
  section('Phrases the game says', (Object.keys(PHRASES) as PhraseId[]).map((k) => ({ id: clipIdForPhrase(k), label: '💬', tip: PHRASES[k], fallbackText: PHRASES[k] })));

  // Words: only show the ones she can currently decode + tricky words to keep the list short.
  const words = eligibleWords(app.profile).slice(0, 80);
  section(`Words she is working on (${words.length})`, words.map((w) => ({ id: clipIdForWord(w.w), label: w.w, tip: `Say “${w.w}” naturally. Optional: also record the stretched version below.`, fallbackText: w.w })));
  section('Stretched blends (optional, e.g. “mmmuuud”)', words.slice(0, 40).map((w) => ({ id: clipIdForBlend(w.w), label: w.w, tip: `Say “${w.w}” slowly with the sounds joined together, no gaps: “${w.g.join('…')}”.`, fallbackText: w.w })));
  const tricky = TRICKY.filter((t) => t.set <= currentSet(app.profile) + 1);
  section('Tricky words', tricky.map((t) => ({ id: clipIdForWord(t.w), label: t.w, tip: `Say “${t.w}”.`, fallbackText: t.w })));
  return wrap;
}

// ------------------------------------------------------------- settings

function settingsTab(app: App): HTMLElement {
  const s = app.profile.settings;
  const wrap = h('div');
  const save = () => void app.save();
  const items = h('input', { type: 'range', min: '10', max: '30', step: '2', value: String(s.sessionItems) }) as HTMLInputElement;
  const itemsOut = h('span', { class: 'pill' }, `${s.sessionItems} items (~${Math.round(s.sessionItems * 0.4)} min)`);
  items.addEventListener('input', () => { s.sessionItems = Number(items.value); itemsOut.textContent = `${s.sessionItems} items (~${Math.round(s.sessionItems * 0.4)} min)`; save(); });

  const step = h('select', {}, h('option', { value: '3', selected: s.stepUp === 3 }, 'Gentler (~79% success)'), h('option', { value: '4', selected: s.stepUp === 4 }, 'Standard (~84% success)'), h('option', { value: '5', selected: s.stepUp === 5 }, 'Steadier (~87% success)')) as HTMLSelectElement;
  step.addEventListener('change', () => { s.stepUp = Number(step.value); save(); });

  const maxSet = h('select', {}, ...Array.from({ length: MAX_SET }, (_, i) => h('option', { value: String(i + 1), selected: s.maxSet === i + 1 }, `Up to set ${i + 1}`))) as HTMLSelectElement;
  maxSet.addEventListener('change', () => { s.maxSet = Number(maxSet.value); save(); });

  wrap.append(
    h('h2', {}, 'Settings'),
    h('div', { class: 'field' }, h('label', {}, 'Session length'), h('div', { class: 'row' }, items, itemsOut)),
    h('div', { class: 'field' }, h('label', {}, 'Challenge level'), step),
    h('div', { class: 'field' }, h('label', {}, 'Furthest sound set to introduce automatically'), maxSet),
    h('p', { class: 'muted' }, 'The game targets roughly 80–85% success by choosing which letters appear as distractors — never by changing whether an answer counts. Sets follow the UK Letters and Sounds order (the same one Teach Your Monster uses): 1 s a t p · 2 i n m d · 3 g o c k · 4 ck e u r · 5 h b f ff l ll ss · 6 j v w x y z zz qu · 7 ch sh th ng · 8 ai ee igh oa oo · 9 ar or ur ow oi · 10 ear air er.'),
    h('div', { class: 'setname' }, 'Placement'),
    h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => app.go('placement') }, 'Redo the sound check'), h('span', { class: 'muted' }, 'Re-seeds which sounds she already knows.')),
  );
  return wrap;
}

// ----------------------------------------------------------------- data

function dataTab(app: App, rerender: () => void): HTMLElement {
  const wrap = h('div');
  const ta = h('textarea', { class: 'json', readonly: true, placeholder: 'Progress JSON appears here' }) as HTMLTextAreaElement;
  const exportBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: async () => {
    const json = JSON.stringify(app.profile);
    ta.value = json;
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], `read-quest-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'Read Quest progress' }); return; } catch { /* fall through */ }
    }
    const a = h('a', { href: URL.createObjectURL(blob), download: file.name });
    a.click();
  } }, '⬇️ Export progress');
  const importInput = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' } }) as HTMLInputElement;
  importInput.addEventListener('change', async () => {
    const f = importInput.files?.[0];
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      app.profile = migrateProfile(raw);
      await app.save();
      rerender();
      alert('Progress imported.');
    } catch {
      alert('That file did not look like Read Quest progress.');
    }
  });
  const importBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: () => importInput.click() }, '⬆️ Import progress');
  const resetBtn = h('button', { class: 'btn pink small', type: 'button', onclick: async () => {
    if (!confirm('Start completely over? This erases all progress (recordings are kept).')) return;
    await app.reset();
    app.go('start');
  } }, 'Reset progress');
  const wipeAudio = h('button', { class: 'btn pink small', type: 'button', onclick: async () => {
    if (!confirm('Delete all your recorded clips?')) return;
    await db.clear('audio');
    await app.audio.init();
    alert('Recordings removed.');
  } }, 'Delete recordings');

  const events = app.profile.log.length;
  wrap.append(
    h('h2', {}, 'Your data'),
    h('p', {}, `Everything lives on this device only — nothing is sent anywhere. ${events} practice events logged. Export a copy now and then (iOS can clear website data if the app is not opened for a long time; adding it to the Home Screen prevents that).`),
    h('div', { class: 'row' }, exportBtn, importBtn, importInput),
    ta,
    h('div', { class: 'setname' }, 'Danger zone'),
    h('div', { class: 'row' }, resetBtn, wipeAudio),
    h('div', { class: 'setname' }, 'About'),
    h('p', { class: 'muted' }, `Read Quest — ${UNIQUE_WORDS.length} decodable words, ${GPCS.length} letter-sounds, ${TRICKY.length} tricky words. Adaptive engine: Bayesian Knowledge Tracing per sound, Elo for reading/spelling, expanding-interval review, 1-up/N-down difficulty staircase. Built for one small reader.`),
  );
  return wrap;
}

// ---------------------------------------------------------------- print

export function printScreen(app: App): HTMLElement {
  const el = h('div', { class: 'screen scroll', style: { background: '#fff' } });
  const sentences: string[] = [];
  const avoid = new Set<string>();
  for (let i = 0; i < 12 && sentences.length < 5; i++) {
    const s = makeSentence(app.profile, Math.random, avoid);
    if (s && !sentences.includes(s.text)) {
      sentences.push(s.text);
      s.words.forEach((w) => avoid.add(w));
    }
  }
  const words = eligibleWords(app.profile, { needEmoji: false }).sort(() => Math.random() - 0.5).slice(0, 16).map((w) => w.w);
  el.append(
    h('div', { class: 'topbar no-print' }, h('h1', {}, 'Tonight’s reading'), h('div', { class: 'grow' }), h('button', { class: 'btn ghost small', type: 'button', onclick: () => window.print() }, '🖨️ Print'), h('button', { class: 'btn green small', type: 'button', onclick: () => app.go('parent') }, 'Back')),
    h('div', { style: { maxWidth: '800px', margin: '0 auto', fontSize: '32px', lineHeight: '2', fontWeight: '700' } },
      sentences.length ? sentences.map((s) => h('div', {}, s)) : h('p', {}, 'Not enough known sounds for sentences yet — try the words below.'),
      h('div', { style: { fontSize: '26px', marginTop: '24px', fontWeight: '400', color: '#555' } }, 'Words: ', words.join('   ')),
      h('p', { class: 'muted', style: { fontSize: '16px' } }, 'Tip: point under each letter as she says its sound, then “say it fast”. If she guesses from the first letter, cover the word and reveal it sound by sound.'),
    ),
  );
  return el;
}
