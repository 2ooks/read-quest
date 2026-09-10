// Small visual feedback helpers: sparkles, confetti, scene background.

import { h } from './dom.ts';

const CONFETTI_COLORS = ['#ff6b8a', '#43c8ff', '#3fc26a', '#ffd23f', '#7c5cff', '#ff9f43'];

export function confetti(container: HTMLElement, count = 80): void {
  const layer = h('div', { class: 'confetti' });
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
  }
  container.appendChild(layer);
  setTimeout(() => layer.remove(), 4200);
}

export function sparkleAt(el: HTMLElement, symbols = ['✨', '⭐', '🌟']): void {
  const rect = el.getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    const s = h('div', { class: 'sparkle' }, symbols[i % symbols.length]);
    s.style.left = `${rect.left + rect.width * (0.15 + Math.random() * 0.7)}px`;
    s.style.top = `${rect.top + rect.height * (0.1 + Math.random() * 0.5)}px`;
    s.style.animationDelay = `${i * 0.06}s`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

export function scene(): HTMLElement {
  const s = h('div', { class: 'scene' });
  s.appendChild(h('div', { class: 'sun' }));
  for (let i = 0; i < 3; i++) {
    const c = h('div', { class: 'cloud' });
    c.style.top = `${8 + i * 14}%`;
    c.style.width = `${90 + i * 40}px`;
    c.style.height = `${28 + i * 8}px`;
    c.style.animationDuration = `${60 + i * 25}s`;
    c.style.animationDelay = `${-i * 20}s`;
    s.appendChild(c);
  }
  s.appendChild(h('div', { class: 'hill c' }));
  s.appendChild(h('div', { class: 'hill a' }));
  s.appendChild(h('div', { class: 'hill b' }));
  return s;
}
