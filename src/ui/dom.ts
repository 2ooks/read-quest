// Tiny DOM helper — no framework needed for a handful of screens.

type Child = Node | string | number | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, unknown> | null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v as Record<string, string>);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v as Record<string, string>);
      else if (k === 'html') el.innerHTML = String(v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: (Child | Child[])[]): void {
  for (const c of children) {
    if (Array.isArray(c)) append(el, c);
    else if (c === null || c === undefined || c === false) continue;
    else if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function svgEl(markup: string): SVGElement {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as SVGElement;
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Big friendly button. */
export function button(label: string | Node, onClick: () => void, cls = ''): HTMLButtonElement {
  return h('button', { class: `btn ${cls}`, onclick: onClick, type: 'button' }, label);
}

/** Icon-style round button. */
export function iconButton(icon: string, onClick: () => void, label: string, cls = ''): HTMLButtonElement {
  return h('button', { class: `icon-btn ${cls}`, onclick: onClick, type: 'button', 'aria-label': label, title: label }, icon);
}

/** Press-and-hold gate for grown-up areas (1.4 s). */
export function holdButton(icon: string, onHold: () => void, label: string): HTMLButtonElement {
  const btn = h('button', { class: 'icon-btn hold-btn', type: 'button', 'aria-label': label, title: label }, icon);
  let timer: number | null = null;
  const start = (e: Event) => {
    e.preventDefault();
    btn.classList.add('holding');
    timer = window.setTimeout(() => {
      btn.classList.remove('holding');
      timer = null;
      onHold();
    }, 1400);
  };
  const cancel = () => {
    btn.classList.remove('holding');
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', cancel);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointercancel', cancel);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

/** Wait for one pointer tap on any of `targets`; resolves with the element and latency. */
export function awaitTap<T extends HTMLElement>(targets: T[], startTime: number, minDelayMs = 250): Promise<{ el: T; ms: number }> {
  return new Promise((resolve) => {
    const handlers: (() => void)[] = [];
    const done = (el: T) => {
      handlers.forEach((off) => off());
      resolve({ el, ms: performance.now() - startTime });
    };
    for (const el of targets) {
      const fn = (e: Event) => {
        // ignore taps that arrive suspiciously fast after the screen changed (accidental double-taps)
        if (performance.now() - startTime < minDelayMs) return;
        e.preventDefault();
        done(el);
      };
      el.addEventListener('pointerdown', fn);
      handlers.push(() => el.removeEventListener('pointerdown', fn));
    }
  });
}
