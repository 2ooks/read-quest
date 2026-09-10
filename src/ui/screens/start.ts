// Start screen: the single tap that unlocks audio on iOS, then routes.

import type { App } from '../../app.ts';
import { h } from '../dom.ts';
import { scene } from '../feedback.ts';
import { monsterSvg } from '../monster.ts';

export function startScreen(app: App): HTMLElement {
  const el = h('div', { class: 'screen' });
  el.appendChild(scene());
  const mon = h('div', { class: 'monster-wrap bob', html: monsterSvg(app.profile.monster) });
  const title = h('h1', { class: 'center' }, 'Read Quest');
  const btn = h('button', { class: 'btn big yellow', type: 'button' }, '▶  Tap to start');
  let started = false;
  btn.addEventListener('click', async () => {
    if (started) return;
    started = true;
    btn.textContent = '…';
    await app.audio.init();
    // Warm up the clips we always need.
    app.audio.preload(['p_hello', 'p_tap_the_sound', 'p_listen_again', 'p_yes', 'p_great', 'p_thats_it', 'p_brilliant']);
    if (!app.profile.onboarded) app.go('maker');
    else if (!app.profile.placed) app.go('placement');
    else app.go('home');
  });
  el.appendChild(h('div', { class: 'stage' }, mon, title, btn, h('p', { class: 'muted center' }, 'Best on an iPad, sideways. Add to Home Screen to play offline.')));
  return el;
}
