// Audio playback. Resolution order for a clip id:
//   1. parent-recorded clip (IndexedDB)  2. bundled mp3  3. speech synthesis.
// Everything runs through one AudioContext unlocked by the first tap.

import { GPC_BY_ID } from '../content/gpcs.ts';
import { PHRASES, type PhraseId } from '../content/phrases.ts';
import { db } from '../storage/db.ts';
import { clipIdForBlend, clipIdForPhrase, clipIdForSound, clipIdForWord } from './clips.ts';

const BASE = import.meta.env.BASE_URL;

export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private overrides = new Set<string>();
  private index: Record<string, number> = {};
  private playing = new Set<AudioBufferSourceNode>();
  private gain: GainNode | null = null;
  muted = false;

  async init(): Promise<void> {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.gain = this.ctx.createGain();
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined);
    if (!Object.keys(this.index).length) {
      try {
        this.index = await (await fetch(`${BASE}audio/index.json`)).json();
      } catch {
        this.index = {};
      }
    }
    try {
      const keys = await db.keys('audio');
      this.overrides = new Set(keys);
    } catch {
      /* no recordings */
    }
  }

  get unlocked(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** The shared AudioContext (after init). */
  get context(): AudioContext | null {
    return this.ctx;
  }

  hasBundled(id: string): boolean {
    return id in this.index;
  }

  hasRecording(id: string): boolean {
    return this.overrides.has(id);
  }

  async setRecording(id: string, blob: Blob): Promise<void> {
    await db.set('audio', id, blob);
    this.overrides.add(id);
    this.buffers.delete(id);
  }

  async removeRecording(id: string): Promise<void> {
    await db.del('audio', id);
    this.overrides.delete(id);
    this.buffers.delete(id);
  }

  async decodeBlob(blob: Blob): Promise<AudioBuffer> {
    await this.init();
    const buf = await blob.arrayBuffer();
    return await this.ctx!.decodeAudioData(buf);
  }

  private async load(id: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(id);
    if (cached) return cached;
    if (!this.ctx) await this.init();
    let data: ArrayBuffer | null = null;
    if (this.overrides.has(id)) {
      const blob = await db.get<Blob>('audio', id);
      if (blob) data = await blob.arrayBuffer();
    }
    if (!data && this.hasBundled(id)) {
      try {
        const res = await fetch(`${BASE}audio/${id}.mp3`);
        if (res.ok) data = await res.arrayBuffer();
      } catch {
        data = null;
      }
    }
    if (!data) return null;
    try {
      const buf = await this.ctx!.decodeAudioData(data.slice(0));
      this.buffers.set(id, buf);
      return buf;
    } catch {
      return null;
    }
  }

  /** Pre-decode a set of clips so later playback is instant. */
  async preload(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.load(id).catch(() => null)));
  }

  stopAll(): void {
    for (const s of this.playing) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.playing.clear();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  /** Play a clip; resolves when it finishes. Falls back to TTS of `fallbackText`. */
  async play(id: string, fallbackText?: string, rate = 1): Promise<void> {
    if (this.muted) return;
    const buf = await this.load(id);
    if (buf && this.ctx && this.gain) {
      await new Promise<void>((resolve) => {
        const src = this.ctx!.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        src.connect(this.gain!);
        this.playing.add(src);
        src.onended = () => {
          this.playing.delete(src);
          resolve();
        };
        src.start();
      });
      return;
    }
    if (fallbackText) await speak(fallbackText);
  }

  async playSeq(ids: { id: string; text?: string; rate?: number }[], gapMs = 90): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.play(ids[i].id, ids[i].text, ids[i].rate);
      if (i < ids.length - 1 && gapMs) await wait(gapMs);
    }
  }

  // ---- convenience
  sound(gpcId: string, rate = 1): Promise<void> {
    const g = GPC_BY_ID[gpcId];
    return this.play(clipIdForSound(gpcId), g ? g.cue : gpcId, rate);
  }
  word(spelling: string): Promise<void> {
    return this.play(clipIdForWord(spelling), spelling);
  }
  /** Slow connected pronunciation ("mmmuuud"); falls back to the sounds then the word. */
  async blend(spelling: string, graphemes: string[]): Promise<void> {
    const id = clipIdForBlend(spelling);
    if (this.hasRecording(id) || this.hasBundled(id)) return this.play(id, spelling, 1);
    await this.sounds(graphemes, 60);
  }
  async sounds(graphemes: string[], gapMs = 140): Promise<void> {
    await this.playSeq(graphemes.map((g) => ({ id: clipIdForSound(g), text: GPC_BY_ID[g]?.cue })), gapMs);
  }
  phrase(id: PhraseId): Promise<void> {
    return this.play(clipIdForPhrase(id), PHRASES[id]);
  }
  async words(spellings: string[]): Promise<void> {
    await this.playSeq(spellings.map((w) => ({ id: clipIdForWord(w), text: w })), 160);
  }

  /** Short synthesized UI tones (no assets needed). */
  tone(kind: 'tap' | 'yes' | 'no' | 'fanfare'): void {
    if (this.muted || !this.ctx || !this.gain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const beep = (freq: number, t0: number, dur: number, vol = 0.08, type: OscillatorType = 'sine') => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + t0);
      g.gain.linearRampToValueAtTime(vol, now + t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g).connect(this.gain!);
      o.start(now + t0);
      o.stop(now + t0 + dur + 0.02);
    };
    switch (kind) {
      case 'tap': beep(660, 0, 0.08, 0.04); break;
      case 'yes': beep(660, 0, 0.12); beep(880, 0.1, 0.18); break;
      case 'no': beep(330, 0, 0.18, 0.03, 'triangle'); break;
      case 'fanfare': beep(523, 0, 0.15); beep(659, 0.14, 0.15); beep(784, 0.28, 0.15); beep(1047, 0.42, 0.4); break;
    }
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined) return voice;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const en = voices.filter((v) => v.lang.startsWith('en'));
  voice = en.find((v) => /samantha|karen|moira|zira|aria|jenny/i.test(v.name)) ?? en.find((v) => v.lang === 'en-US') ?? en[0] ?? null;
  return voice;
}

export function speak(text: string, rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1.05;
    const v = pickVoice();
    if (v) u.voice = v;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, Math.max(1500, 200 + text.length * 90));
    window.speechSynthesis.speak(u);
  });
}

export const audio = new AudioPlayer();
