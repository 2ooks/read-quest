"""Post-process synthesized WAVs: trim silence, normalize loudness, fade edges,
encode to MP3 (mono, 48 kbps) in public/audio/. Also writes public/audio/index.json.

usage: python tools/post-audio.py
"""
import json, os, sys, wave
import numpy as np
import lameenc

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WAV_DIR = os.path.join(ROOT, 'tools', 'wav')
OUT_DIR = os.path.join(ROOT, 'public', 'audio')
os.makedirs(OUT_DIR, exist_ok=True)

manifest = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json'), encoding='utf-8'))

TARGET_RMS = {'sound': 0.16, 'word': 0.14, 'blend': 0.14, 'phrase': 0.13}
PAD_MS = {'sound': 40, 'word': 60, 'blend': 60, 'phrase': 80}


def load(path):
    w = wave.open(path)
    sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return sr, a


def trim(a, sr, thr=0.008, pad_ms=40):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    pad = int(sr * pad_ms / 1000)
    s = max(0, idx[0] - pad)
    e = min(len(a), idx[-1] + pad)
    return a[s:e]


def normalize(a, target_rms, peak_cap=0.92):
    rms = np.sqrt(np.mean(a ** 2)) if len(a) else 0
    if rms <= 1e-6:
        return a
    g = target_rms / rms
    peak = np.abs(a).max() * g
    if peak > peak_cap:
        g *= peak_cap / peak
    return a * g


def fade(a, sr, ms=8):
    n = min(len(a) // 2, int(sr * ms / 1000))
    if n <= 0:
        return a
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    a = a.copy()
    a[:n] *= ramp
    a[-n:] *= ramp[::-1]
    return a


def encode_mp3(a, sr, path, kbps):
    enc = lameenc.Encoder()
    enc.set_bit_rate(kbps)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()
    data = enc.encode(pcm) + enc.flush()
    with open(path, 'wb') as f:
        f.write(data)


index = {}
stats = []
for c in manifest:
    src = os.path.join(WAV_DIR, c['id'] + '.wav')
    if not os.path.exists(src):
        print('missing', c['id'], file=sys.stderr)
        continue
    sr, a = load(src)
    a = trim(a, sr, pad_ms=PAD_MS[c['kind']])
    a = normalize(a, TARGET_RMS[c['kind']])
    a = fade(a, sr)
    # small silence pad so playback never clicks
    pad = np.zeros(int(sr * 0.02), dtype=np.float32)
    a = np.concatenate([pad, a, pad])
    out = os.path.join(OUT_DIR, c['id'] + '.mp3')
    encode_mp3(a, sr, out, 48 if c['kind'] == 'sound' else 32)
    index[c['id']] = round(len(a) / sr, 3)
    stats.append((c['id'], c['kind'], len(a) / sr))

json.dump(index, open(os.path.join(OUT_DIR, 'index.json'), 'w'), separators=(',', ':'))
total = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR))
print(f'encoded {len(index)} clips, {total/1024/1024:.2f} MB total')
sounds = [s for s in stats if s[1] == 'sound']
print('sound durations: ' + ', '.join(f'{i}={d:.2f}' for i, _, d in sounds))
