// Wardrobe: equip unlocked items; locked items shown as mysteries.

import type { App } from '../../app.ts';
import { WARDROBE } from '../../content/wardrobe.ts';
import { h, clear } from '../dom.ts';
import { scene } from '../feedback.ts';
import { monsterSvg } from '../monster.ts';

export function wardrobeScreen(app: App): HTMLElement {
  const m = app.profile.monster;
  const el = h('div', { class: 'screen scroll' });
  el.appendChild(scene());
  const preview = h('div', { class: 'monster-wrap bob', html: monsterSvg(m) });
  const grid = h('div', { class: 'options', style: { maxWidth: '640px' } });

  function render(): void {
    preview.innerHTML = monsterSvg(m);
    clear(grid);
    for (const item of WARDROBE) {
      const unlocked = m.items.includes(item.id);
      const on = m.equipped.includes(item.id);
      const b = h('button', { class: `opt ${on ? 'sel' : ''}`, type: 'button', title: item.name, style: unlocked ? {} : { opacity: '0.35' } }, unlocked ? item.emoji : '❔');
      if (unlocked) {
        b.addEventListener('click', async () => {
          if (on) m.equipped = m.equipped.filter((x) => x !== item.id);
          else {
            // one item per slot
            m.equipped = m.equipped.filter((x) => WARDROBE.find((w) => w.id === x)?.slot !== item.slot);
            m.equipped.push(item.id);
          }
          app.audio.tone('tap');
          await app.save();
          render();
        });
      }
      grid.appendChild(b);
    }
  }
  render();

  el.append(
    h('div', { class: 'topbar' },
      h('h1', {}, 'Dress up'),
      h('div', { class: 'grow' }),
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => app.go('maker', { edit: true }) }, '🎨 Change monster'),
      h('button', { class: 'btn green', type: 'button', onclick: () => app.go('home') }, 'Done ✓'),
    ),
    h('div', { class: 'stage', style: { flexDirection: 'row', flexWrap: 'wrap' } }, preview, grid),
  );
  return el;
}
