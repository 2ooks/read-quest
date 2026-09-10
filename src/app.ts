// App shell: profile persistence + screen navigation.

import { audio, type AudioPlayer } from './audio/audio.ts';
import { migrateProfile, newProfile, type Profile } from './engine/state.ts';
import { db, requestPersistence } from './storage/db.ts';
import { clear } from './ui/dom.ts';

export type ScreenName = 'start' | 'maker' | 'placement' | 'home' | 'session' | 'complete' | 'parent' | 'wardrobe' | 'print';

export interface App {
  profile: Profile;
  audio: AudioPlayer;
  root: HTMLElement;
  go(screen: ScreenName, params?: Record<string, unknown>): void;
  save(): Promise<void>;
  reset(): Promise<void>;
}

type ScreenFn = (app: App, params: Record<string, unknown>) => HTMLElement | Promise<HTMLElement>;

const screens: Partial<Record<ScreenName, ScreenFn>> = {};

export function registerScreen(name: ScreenName, fn: ScreenFn): void {
  screens[name] = fn;
}

const PROFILE_KEY = 'profile';

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await db.get<Profile>('kv', PROFILE_KEY);
    if (raw) return migrateProfile(raw);
  } catch {
    /* fall through */
  }
  // localStorage mirror as a safety net
  try {
    const ls = localStorage.getItem('readquest.profile');
    if (ls) return migrateProfile(JSON.parse(ls));
  } catch {
    /* ignore */
  }
  return newProfile();
}

export async function createApp(root: HTMLElement): Promise<App> {
  const profile = await loadProfile();
  requestPersistence();
  let saving: Promise<void> | null = null;

  const app: App = {
    profile,
    audio,
    root,
    go(screen, params = {}) {
      const fn = screens[screen];
      if (!fn) throw new Error(`no screen ${screen}`);
      audio.stopAll();
      Promise.resolve(fn(app, params)).then((el) => {
        clear(root);
        root.appendChild(el);
      });
    },
    async save() {
      const snapshot = JSON.stringify(app.profile);
      saving = (saving ?? Promise.resolve()).then(async () => {
        try {
          await db.set('kv', PROFILE_KEY, JSON.parse(snapshot));
        } catch {
          /* ignore */
        }
        try {
          localStorage.setItem('readquest.profile', snapshot);
        } catch {
          /* ignore */
        }
      });
      await saving;
    },
    async reset() {
      app.profile = newProfile();
      await app.save();
    },
  };
  return app;
}
