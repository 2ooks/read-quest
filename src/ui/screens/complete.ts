// Session complete: celebrate finishing (not accuracy), unlock a wardrobe
// item or sticker, nudge toward reading together tonight.

import type { App } from '../../app.ts';
import { STICKERS, WARDROBE } from '../../content/wardrobe.ts';
import { h } from '../dom.ts';
import { confetti, scene } from '../feedback.ts';
import { monsterSvg } from '../monster.ts';

export async function completeScreen(app: App): Promise<HTMLElement> {
  const p = app.profile;
  const el = h('div', { class: 'screen' });
  el.appendChild(scene());

  // Reward: next wardrobe item, then stickers.
  let rewardEl: HTMLElement;
  const next = WARDROBE.find((w) => !p.monster.items.includes(w.id));
  if (next) {
    p.monster.items.push(next.id);
    p.monster.equipped = p.monster.equipped.filter((x) => WARDROBE.find((w) => w.id === x)?.slot !== next.slot);
    p.monster.equipped.push(next.id);
    rewardEl = h('div', { class: 'card pop center' }, h('div', { class: 'emoji-big' }, next.emoji), h('h2', {}, `New: ${next.name}!`));
  } else {
    const sticker = STICKERS[p.sessions.length % STICKERS.length];
    rewardEl = h('div', { class: 'card pop center' }, h('div', { class: 'emoji-big' }, sticker), h('h2', {}, 'A new sticker!'));
  }
  await app.save();

  const mon = h('div', { class: 'monster-wrap dance', html: monsterSvg(p.monster) });
  el.appendChild(
    h('div', { class: 'stage' },
      h('h1', { class: 'center' }, 'All done! 🎉'),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '30px' } }, mon, rewardEl),
      h('p', { class: 'muted center' }, 'Tonight: read a book together — that is where the words come alive.'),
      h('button', { class: 'btn green big', type: 'button', onclick: () => app.go('home') }, 'Home 🏠'),
    ),
  );
  setTimeout(() => confetti(el), 100);
  setTimeout(async () => {
    app.audio.tone('fanfare');
    await app.audio.phrase('all_done');
    if (next) await app.audio.phrase('new_thing');
  }, 200);
  return el;
}
