// Home: the monster on its island, Play buttons, wardrobe, grown-up gate.

import type { App } from '../../app.ts';
import { h, holdButton, iconButton } from '../dom.ts';
import { scene } from '../feedback.ts';
import { monsterSvg } from '../monster.ts';

export function homeScreen(app: App): HTMLElement {
  const p = app.profile;
  const el = h('div', { class: 'screen' });
  el.appendChild(scene());

  const top = h('div', { class: 'topbar' },
    h('div', { class: 'row' }, h('span', { class: 'pill' }, `${p.sessions.length} quests`)),
    h('div', { class: 'grow' }),
    iconButton('👒', () => app.go('wardrobe'), 'Dress up'),
    holdButton('⚙️', () => app.go('parent'), 'Grown-ups (hold)'),
  );

  const mon = h('div', { class: 'monster-wrap bob', html: monsterSvg(p.monster) });
  mon.addEventListener('click', () => {
    mon.classList.remove('bob');
    mon.classList.add('happy');
    app.audio.tone('yes');
    setTimeout(() => { mon.classList.remove('happy'); mon.classList.add('bob'); }, 1300);
  });

  const play = (coPlay: boolean) => {
    p.settings.coPlay = coPlay;
    app.go('session', { coPlay });
  };

  const buttons = h('div', { class: 'stack' },
    h('button', { class: 'btn green big', type: 'button', onclick: () => play(true) }, '▶  Play with a grown-up'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => play(false) }, 'Play by myself'),
  );

  el.append(top, h('div', { class: 'stage' }, mon, h('h1', { class: 'center' }, p.monster.name || 'Your monster'), buttons));
  setTimeout(() => app.audio.phrase('hello'), 300);
  return el;
}
