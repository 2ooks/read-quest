// Monster maker: the child designs her reading buddy.

import type { App } from '../../app.ts';
import { h, clear } from '../dom.ts';
import { scene } from '../feedback.ts';
import { BODY_COUNT, EYE_COUNT, HORN_COUNT, MOUTH_COUNT, PALETTE, PATTERN_COUNT, monsterSvg } from '../monster.ts';

const NAME_IDEAS = ['Bloop', 'Zizi', 'Momo', 'Pip', 'Tilly', 'Gus', 'Nini', 'Dot', 'Ziggy', 'Bea', 'Fizz', 'Lulu'];

export function makerScreen(app: App, params: Record<string, unknown>): HTMLElement {
  const m = app.profile.monster;
  const editing = !!params.edit;
  const el = h('div', { class: 'screen' });
  el.appendChild(scene());

  const preview = h('div', { class: 'monster-wrap bob', html: monsterSvg(m) });
  const refresh = () => {
    preview.innerHTML = monsterSvg(m);
  };

  const steps = [
    { label: 'Pick a shape', icons: ['⚪', '🥚', '🫓'], key: 'body', count: BODY_COUNT },
    { label: 'Pick a color', icons: [], key: 'color', count: PALETTE.length },
    { label: 'Eyes', icons: ['👁️', '👀', '👁️👁️👁️'], key: 'eyes', count: EYE_COUNT },
    { label: 'Mouth', icons: ['🙂', '😁', '😛'], key: 'mouth', count: MOUTH_COUNT },
    { label: 'On top', icons: ['⭕', '😈', '📡', '🐰'], key: 'horns', count: HORN_COUNT },
    { label: 'Pattern', icons: ['⬜', '🔵', '〰️', '🌕'], key: 'pattern', count: PATTERN_COUNT },
  ] as const;

  let step = 0;
  const panel = h('div', { class: 'stack' });
  const title = h('h2', { class: 'center' });
  const opts = h('div', { class: 'options' });
  const nav = h('div', { class: 'row' });
  panel.append(title, opts, nav);

  const nameInput = h('input', { class: 'name-input', type: 'text', maxlength: '14', placeholder: 'Monster name', value: m.name, autocomplete: 'off' }) as HTMLInputElement;

  function render(): void {
    clear(opts);
    clear(nav);
    if (step < steps.length) {
      const s = steps[step];
      title.textContent = s.label;
      for (let i = 0; i < s.count; i++) {
        const sel = (m as unknown as Record<string, number>)[s.key] === i;
        let b: HTMLElement;
        if (s.key === 'color') {
          b = h('button', { class: `swatch ${sel ? 'sel' : ''}`, type: 'button', style: { background: PALETTE[i] } });
        } else {
          b = h('button', { class: `opt ${sel ? 'sel' : ''}`, type: 'button' }, s.icons[i] ?? String(i + 1));
        }
        b.addEventListener('click', () => {
          (m as unknown as Record<string, number>)[s.key] = i;
          app.audio.tone('tap');
          refresh();
          render();
        });
        opts.appendChild(b);
      }
      if (step > 0) nav.appendChild(h('button', { class: 'btn ghost', type: 'button', onclick: () => { step--; render(); } }, '◀'));
      nav.appendChild(h('button', { class: 'btn green', type: 'button', onclick: () => { step++; render(); } }, 'Next ▶'));
    } else {
      title.textContent = 'What is your monster called?';
      opts.appendChild(nameInput);
      const ideas = h('div', { class: 'options' });
      for (const n of NAME_IDEAS.slice(0, 6)) {
        ideas.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { nameInput.value = n; } }, n));
      }
      opts.appendChild(ideas);
      nav.appendChild(h('button', { class: 'btn ghost', type: 'button', onclick: () => { step--; render(); } }, '◀'));
      nav.appendChild(
        h('button', {
          class: 'btn green big', type: 'button',
          onclick: async () => {
            m.name = nameInput.value.trim() || NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)];
            app.profile.onboarded = true;
            await app.save();
            app.audio.tone('fanfare');
            if (editing || app.profile.placed) app.go('home');
            else app.go('placement');
          },
        }, editing ? 'Done ✓' : 'Done! ✓'),
      );
    }
  }
  render();

  const top = h('div', { class: 'topbar' }, h('h1', {}, editing ? 'Change your monster' : 'Make your monster'), h('div', { class: 'grow' }));
  if (editing) top.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => app.go('home') }, 'Cancel'));
  el.appendChild(top);
  el.appendChild(h('div', { class: 'stage', style: { flexDirection: 'row', flexWrap: 'wrap' } }, preview, panel));
  return el;
}
