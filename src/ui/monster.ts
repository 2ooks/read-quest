// Procedural SVG monster. Everything is parameterised so the child can design
// her own creature (ownership → motivation), and rewards dress it up.

import type { Monster } from '../engine/state.ts';

export const PALETTE = ['#7c5cff', '#ff6b8a', '#43c8ff', '#5ad66f', '#ffb347', '#ffe14d', '#4de2c9', '#ff8f5c'];
export const BODY_COUNT = 3;
export const EYE_COUNT = 3;
export const MOUTH_COUNT = 3;
export const HORN_COUNT = 4;
export const PATTERN_COUNT = 4;

interface Anchors {
  top: [number, number];
  eyeY: number;
  mouthY: number;
  left: [number, number];
  right: [number, number];
  bottom: number;
  rx: number;
  cx: number;
  cy: number;
  ry: number;
}

const ANCHORS: Anchors[] = [
  { top: [100, 48], eyeY: 102, mouthY: 148, left: [32, 128], right: [168, 128], bottom: 192, rx: 70, ry: 72, cx: 100, cy: 120 },
  { top: [100, 30], eyeY: 92, mouthY: 142, left: [44, 122], right: [156, 122], bottom: 200, rx: 58, ry: 85, cx: 100, cy: 115 },
  { top: [100, 77], eyeY: 122, mouthY: 162, left: [20, 142], right: [180, 142], bottom: 193, rx: 82, ry: 58, cx: 100, cy: 135 },
];

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function eye(x: number, y: number, r: number): string {
  return `<g class="eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * 0.15}" cy="${y + r * 0.1}" r="${r * 0.5}" fill="#2b2140"/><circle cx="${x + r * 0.32}" cy="${y - r * 0.2}" r="${r * 0.16}" fill="#fff"/></g>`;
}

function eyes(m: Monster, a: Anchors): string {
  const y = a.eyeY;
  switch (m.eyes % EYE_COUNT) {
    case 0:
      return eye(100, y, 22);
    case 1:
      return eye(78, y, 15) + eye(122, y, 15);
    default:
      return eye(72, y + 4, 12) + eye(100, y - 10, 12) + eye(128, y + 4, 12);
  }
}

function mouth(m: Monster, a: Anchors): string {
  const y = a.mouthY;
  switch (m.mouth % MOUTH_COUNT) {
    case 0:
      return `<path d="M78 ${y} Q100 ${y + 22} 122 ${y}" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 1:
      return `<path d="M74 ${y - 4} Q100 ${y + 30} 126 ${y - 4} Z" fill="#2b2140"/><rect x="84" y="${y - 3}" width="10" height="9" rx="2" fill="#fff"/><rect x="106" y="${y - 3}" width="10" height="9" rx="2" fill="#fff"/>`;
    default:
      return `<path d="M78 ${y} Q100 ${y + 20} 122 ${y}" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="104" cy="${y + 14}" rx="9" ry="10" fill="#ff6b8a"/>`;
  }
}

function horns(m: Monster, a: Anchors, color: string): string {
  const [tx, ty] = a.top;
  const dark = shade(color, -40);
  switch (m.horns % HORN_COUNT) {
    case 1:
      return `<path d="M${tx - 38} ${ty + 14} L${tx - 30} ${ty - 22} L${tx - 14} ${ty + 6} Z" fill="${dark}"/><path d="M${tx + 38} ${ty + 14} L${tx + 30} ${ty - 22} L${tx + 14} ${ty + 6} Z" fill="${dark}"/>`;
    case 2:
      return `<path d="M${tx} ${ty + 4} Q${tx + 6} ${ty - 20} ${tx - 4} ${ty - 30}" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${tx - 4}" cy="${ty - 32}" r="7" fill="#ffe14d"/>`;
    case 3:
      return `<ellipse cx="${tx - 40}" cy="${ty + 10}" rx="12" ry="20" fill="${color}" transform="rotate(-20 ${tx - 40} ${ty + 10})"/><ellipse cx="${tx + 40}" cy="${ty + 10}" rx="12" ry="20" fill="${color}" transform="rotate(20 ${tx + 40} ${ty + 10})"/><ellipse cx="${tx - 40}" cy="${ty + 12}" rx="6" ry="12" fill="#ffd1dc" transform="rotate(-20 ${tx - 40} ${ty + 12})"/><ellipse cx="${tx + 40}" cy="${ty + 12}" rx="6" ry="12" fill="#ffd1dc" transform="rotate(20 ${tx + 40} ${ty + 12})"/>`;
    default:
      return '';
  }
}

function pattern(m: Monster, a: Anchors, color: string): string {
  const dark = shade(color, -30);
  const light = shade(color, 55);
  switch (m.pattern % PATTERN_COUNT) {
    case 1:
      return `<g fill="${dark}" opacity="0.7"><circle cx="${a.cx - a.rx * 0.5}" cy="${a.cy + a.ry * 0.35}" r="9"/><circle cx="${a.cx + a.rx * 0.45}" cy="${a.cy + a.ry * 0.5}" r="7"/><circle cx="${a.cx + a.rx * 0.2}" cy="${a.cy - a.ry * 0.55}" r="6"/><circle cx="${a.cx - a.rx * 0.6}" cy="${a.cy - a.ry * 0.2}" r="5"/></g>`;
    case 2:
      return `<g stroke="${dark}" stroke-width="10" fill="none" opacity="0.55" stroke-linecap="round"><path d="M${a.cx - a.rx * 0.9} ${a.cy + a.ry * 0.3} Q${a.cx} ${a.cy + a.ry * 0.55} ${a.cx + a.rx * 0.9} ${a.cy + a.ry * 0.3}"/><path d="M${a.cx - a.rx * 0.7} ${a.cy + a.ry * 0.7} Q${a.cx} ${a.cy + a.ry * 0.95} ${a.cx + a.rx * 0.7} ${a.cy + a.ry * 0.7}"/></g>`;
    case 3:
      return `<ellipse cx="${a.cx}" cy="${a.cy + a.ry * 0.45}" rx="${a.rx * 0.45}" ry="${a.ry * 0.42}" fill="${light}" opacity="0.85"/>`;
    default:
      return '';
  }
}

function body(a: Anchors, color: string): string {
  const dark = shade(color, -40);
  const feet = `<ellipse cx="${a.cx - 28}" cy="${a.bottom + 4}" rx="20" ry="9" fill="${dark}"/><ellipse cx="${a.cx + 28}" cy="${a.bottom + 4}" rx="20" ry="9" fill="${dark}"/>`;
  const arms = `<ellipse cx="${a.left[0]}" cy="${a.left[1]}" rx="14" ry="10" fill="${color}" transform="rotate(-25 ${a.left[0]} ${a.left[1]})"/><ellipse cx="${a.right[0]}" cy="${a.right[1]}" rx="14" ry="10" fill="${color}" transform="rotate(25 ${a.right[0]} ${a.right[1]})"/>`;
  return `${feet}<ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" fill="url(#bodyGrad)"/>${arms}`;
}

function accessories(m: Monster, a: Anchors): string {
  const [tx, ty] = a.top;
  let out = '';
  for (const id of m.equipped) {
    switch (id) {
      case 'party_hat':
        out += `<path d="M${tx - 26} ${ty + 6} L${tx} ${ty - 48} L${tx + 26} ${ty + 6} Z" fill="#ff6b8a"/><circle cx="${tx}" cy="${ty - 48}" r="7" fill="#ffe14d"/><path d="M${tx - 22} ${ty - 4} L${tx + 22} ${ty - 4}" stroke="#fff" stroke-width="4" stroke-dasharray="6 6"/>`;
        break;
      case 'bow':
        out += `<g transform="translate(${tx + 30} ${ty + 2})"><path d="M0 0 L-18 -12 L-18 12 Z" fill="#ff6b8a"/><path d="M0 0 L18 -12 L18 12 Z" fill="#ff6b8a"/><circle r="5" fill="#d64570"/></g>`;
        break;
      case 'crown':
        out += `<path d="M${tx - 30} ${ty + 8} L${tx - 30} ${ty - 22} L${tx - 15} ${ty - 8} L${tx} ${ty - 28} L${tx + 15} ${ty - 8} L${tx + 30} ${ty - 22} L${tx + 30} ${ty + 8} Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/><circle cx="${tx}" cy="${ty - 2}" r="4" fill="#ff6b8a"/>`;
        break;
      case 'top_hat':
        out += `<rect x="${tx - 34}" y="${ty - 2}" width="68" height="10" rx="4" fill="#2b2140"/><rect x="${tx - 22}" y="${ty - 46}" width="44" height="46" rx="4" fill="#2b2140"/><rect x="${tx - 22}" y="${ty - 10}" width="44" height="7" fill="#7c5cff"/>`;
        break;
      case 'flower':
        out += `<g transform="translate(${tx - 34} ${ty + 4})">${[0, 72, 144, 216, 288].map((r) => `<ellipse rx="6" ry="10" cy="-9" fill="#ff8fb1" transform="rotate(${r})"/>`).join('')}<circle r="5" fill="#ffe14d"/></g>`;
        break;
      case 'pirate_hat':
        out += `<path d="M${tx - 46} ${ty + 6} Q${tx} ${ty - 14} ${tx + 46} ${ty + 6} L${tx + 30} ${ty - 30} Q${tx} ${ty - 42} ${tx - 30} ${ty - 30} Z" fill="#2b2140"/><circle cx="${tx}" cy="${ty - 18}" r="5" fill="#fff"/><path d="M${tx - 8} ${ty - 6} L${tx + 8} ${ty - 6} M${tx - 8} ${ty - 10} L${tx + 8} ${ty - 2} M${tx - 8} ${ty - 2} L${tx + 8} ${ty - 10}" stroke="#fff" stroke-width="2"/>`;
        break;
      case 'headphones':
        out += `<path d="M${tx - 44} ${a.eyeY} Q${tx - 44} ${ty - 10} ${tx} ${ty - 10} Q${tx + 44} ${ty - 10} ${tx + 44} ${a.eyeY}" stroke="#2b2140" stroke-width="6" fill="none"/><rect x="${tx - 54}" y="${a.eyeY - 14}" width="16" height="28" rx="6" fill="#ff6b8a"/><rect x="${tx + 38}" y="${a.eyeY - 14}" width="16" height="28" rx="6" fill="#ff6b8a"/>`;
        break;
      case 'glasses':
        out += `<g stroke="#2b2140" stroke-width="4" fill="none"><circle cx="78" cy="${a.eyeY}" r="19"/><circle cx="122" cy="${a.eyeY}" r="19"/><path d="M97 ${a.eyeY} L103 ${a.eyeY}"/></g>`;
        break;
      case 'sunglasses':
        out += `<g fill="#2b2140"><rect x="58" y="${a.eyeY - 14}" width="38" height="28" rx="10"/><rect x="104" y="${a.eyeY - 14}" width="38" height="28" rx="10"/><rect x="94" y="${a.eyeY - 4}" width="12" height="5"/></g>`;
        break;
      case 'scarf':
        out += `<path d="M${a.cx - 50} ${a.mouthY + 26} Q${a.cx} ${a.mouthY + 44} ${a.cx + 50} ${a.mouthY + 26}" stroke="#ff6b8a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M${a.cx + 30} ${a.mouthY + 32} L${a.cx + 36} ${a.mouthY + 62}" stroke="#ff6b8a" stroke-width="14" stroke-linecap="round"/>`;
        break;
      case 'bowtie':
        out += `<g transform="translate(${a.cx} ${a.mouthY + 34})"><path d="M0 0 L-18 -11 L-18 11 Z" fill="#43c8ff"/><path d="M0 0 L18 -11 L18 11 Z" fill="#43c8ff"/><circle r="5" fill="#1d8fc0"/></g>`;
        break;
      case 'balloon':
        out += `<path d="M${a.right[0] + 6} ${a.right[1]} Q${a.right[0] + 30} ${a.right[1] - 40} ${a.right[0] + 34} ${a.right[1] - 74}" stroke="#2b2140" stroke-width="2" fill="none"/><ellipse cx="${a.right[0] + 34}" cy="${a.right[1] - 92}" rx="18" ry="22" fill="#ff6b8a"/><path d="M${a.right[0] + 30} ${a.right[1] - 72} L${a.right[0] + 38} ${a.right[1] - 72} L${a.right[0] + 34} ${a.right[1] - 66} Z" fill="#d64570"/>`;
        break;
      case 'wand':
        out += `<path d="M${a.right[0] + 4} ${a.right[1] + 4} L${a.right[0] + 40} ${a.right[1] - 50}" stroke="#7c5cff" stroke-width="6" stroke-linecap="round"/><path d="M${a.right[0] + 40} ${a.right[1] - 66} l4 10 10 2 -8 7 2 11 -8 -6 -8 6 2 -11 -8 -7 10 -2 z" fill="#ffe14d"/>`;
        break;
      case 'flag':
        out += `<path d="M${a.right[0] + 6} ${a.right[1] + 4} L${a.right[0] + 12} ${a.right[1] - 66}" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/><path d="M${a.right[0] + 12} ${a.right[1] - 66} L${a.right[0] + 54} ${a.right[1] - 54} L${a.right[0] + 12} ${a.right[1] - 40} Z" fill="#ff6b8a"/>`;
        break;
      case 'star_badge':
        out += `<g transform="translate(${a.cx - a.rx * 0.45} ${a.cy + a.ry * 0.25}) scale(1.3)"><path d="M0 -10 l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1 z" fill="#ffd23f" stroke="#e0a800" stroke-width="1"/></g>`;
        break;
      case 'boots':
        out += `<rect x="${a.cx - 48}" y="${a.bottom - 14}" width="40" height="22" rx="8" fill="#d0342c"/><rect x="${a.cx + 8}" y="${a.bottom - 14}" width="40" height="22" rx="8" fill="#d0342c"/><rect x="${a.cx - 48}" y="${a.bottom - 14}" width="40" height="6" fill="#ffe14d"/><rect x="${a.cx + 8}" y="${a.bottom - 14}" width="40" height="6" fill="#ffe14d"/>`;
        break;
      default:
        break;
    }
  }
  return out;
}

function back(m: Monster, a: Anchors): string {
  let out = '';
  for (const id of m.equipped) {
    if (id === 'wings') {
      out += `<g fill="#c9b6ff" opacity="0.9"><path d="M${a.cx - a.rx + 10} ${a.cy} Q${a.cx - a.rx - 60} ${a.cy - 70} ${a.cx - a.rx - 20} ${a.cy + 30} Z"/><path d="M${a.cx + a.rx - 10} ${a.cy} Q${a.cx + a.rx + 60} ${a.cy - 70} ${a.cx + a.rx + 20} ${a.cy + 30} Z"/></g>`;
    }
    if (id === 'cape') {
      out += `<path d="M${a.cx - a.rx + 14} ${a.cy - a.ry * 0.5} L${a.cx - a.rx - 10} ${a.bottom + 6} L${a.cx + a.rx + 10} ${a.bottom + 6} L${a.cx + a.rx - 14} ${a.cy - a.ry * 0.5} Z" fill="#d0342c"/>`;
    }
  }
  return out;
}

/** Render the monster as an SVG string (viewBox 0 0 200 220). */
export function monsterSvg(m: Monster, extraClass = ''): string {
  const a = ANCHORS[m.body % BODY_COUNT];
  const color = PALETTE[m.color % PALETTE.length];
  const light = shade(color, 40);
  return `<svg class="monster ${extraClass}" viewBox="-40 -40 280 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><radialGradient id="bodyGrad" cx="40%" cy="30%" r="80%"><stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${color}"/></radialGradient></defs>
  ${back(m, a)}
  ${horns(m, a, color)}
  ${body(a, color)}
  ${pattern(m, a, color)}
  ${eyes(m, a)}
  ${mouth(m, a)}
  ${accessories(m, a)}
</svg>`;
}
