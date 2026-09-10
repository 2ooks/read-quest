// Learner profile: everything the adaptive engine knows about the child.

import { GPCS } from '../content/gpcs.ts';
import { TRICKY } from '../content/tricky.ts';

export const PROFILE_VERSION = 1;

export interface KcState {
  /** BKT probability the skill is known. */
  p: number;
  /** Scored attempts (first, unaided responses only). */
  n: number;
  /** Correct first responses. */
  c: number;
  /** Fast (< 2 s) correct responses — an automaticity proxy. */
  fast: number;
  /** Distinct ISO dates with a correct response (kept short). */
  days: string[];
  /** Has this skill been introduced / put in play? */
  intro: boolean;
  /** Next review time (ms since epoch), or null if never practised. */
  due: number | null;
  /** Current review interval in days. */
  ivl: number;
  /** Last time this skill was practised. */
  last: number | null;
}

export interface EloState {
  theta: number;
  n: number;
}

export interface WordState {
  /** Elo item difficulty for reading this word aloud. */
  b: number;
  n: number;
  c: number;
  last: number | null;
}

export interface Stair {
  level: number;
  streak: number;
}

export interface Monster {
  name: string;
  body: number;
  color: number;
  eyes: number;
  mouth: number;
  horns: number;
  pattern: number;
  /** Unlocked wardrobe item ids. */
  items: string[];
  /** Currently worn item ids. */
  equipped: string[];
}

export interface Settings {
  /** Items per session. */
  sessionItems: number;
  /** Staircase: correct-in-a-row needed to step difficulty up (3 ≈ 79 %, 4 ≈ 84 %). */
  stepUp: number;
  /** Default co-play mode (adds "Read to me"). */
  coPlay: boolean;
  /** Highest GPC set that may be introduced automatically. */
  maxSet: number;
}

export interface SessionSummary {
  at: number;
  items: number;
  correct: number;
  minutes: number;
  newGpc: string | null;
}

export interface LogEvent {
  t: number;
  kind: string;
  id: string;
  ok: boolean;
  ms: number;
  hint: boolean;
}

export interface Profile {
  version: number;
  createdAt: number;
  onboarded: boolean;
  placed: boolean;
  monster: Monster;
  gpc: Record<string, KcState>;
  tricky: Record<string, KcState>;
  words: Record<string, WordState>;
  elo: { read: EloState; build: EloState; match: EloState };
  stair: Record<string, Stair>;
  sessions: SessionSummary[];
  log: LogEvent[];
  settings: Settings;
}

export function newKc(intro = false, p = 0.1): KcState {
  return { p, n: 0, c: 0, fast: 0, days: [], intro, due: null, ivl: 0, last: null };
}

export function defaultMonster(): Monster {
  return { name: '', body: 0, color: 0, eyes: 0, mouth: 0, horns: 0, pattern: 0, items: [], equipped: [] };
}

export function defaultSettings(): Settings {
  return { sessionItems: 20, stepUp: 4, coPlay: true, maxSet: 10 };
}

export function newProfile(now = Date.now()): Profile {
  const gpc: Record<string, KcState> = {};
  for (const g of GPCS) gpc[g.id] = newKc(g.set === 1, 0.1);
  const tricky: Record<string, KcState> = {};
  for (const t of TRICKY) tricky[t.w] = newKc(false, 0.1);
  return {
    version: PROFILE_VERSION,
    createdAt: now,
    onboarded: false,
    placed: false,
    monster: defaultMonster(),
    gpc,
    tricky,
    words: {},
    elo: { read: { theta: 0, n: 0 }, build: { theta: 0, n: 0 }, match: { theta: 0, n: 0 } },
    stair: {},
    sessions: [],
    log: [],
    settings: defaultSettings(),
  };
}

/** Fill in anything missing from an older or partial profile. */
export function migrateProfile(raw: Partial<Profile>): Profile {
  const base = newProfile();
  const p: Profile = { ...base, ...raw } as Profile;
  p.gpc = { ...base.gpc, ...(raw.gpc ?? {}) };
  p.tricky = { ...base.tricky, ...(raw.tricky ?? {}) };
  p.words = raw.words ?? {};
  p.elo = { ...base.elo, ...(raw.elo ?? {}) };
  p.stair = raw.stair ?? {};
  p.sessions = raw.sessions ?? [];
  p.log = raw.log ?? [];
  p.settings = { ...base.settings, ...(raw.settings ?? {}) };
  p.monster = { ...base.monster, ...(raw.monster ?? {}) };
  p.version = PROFILE_VERSION;
  return p;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function isoDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
