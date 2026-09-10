// Press-and-hold recorder for the parent's voice. Records with MediaRecorder,
// then trims silence and re-encodes to a small mono WAV so the clip is stable
// across browsers and quick to decode.

export class Recorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];

  static supported(): boolean {
    return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async prepare(): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }

  start(): void {
    if (!this.stream) throw new Error('recorder not prepared');
    this.chunks = [];
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', ''].find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? '';
    this.rec = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.rec.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const rec = this.rec;
      if (!rec) return reject(new Error('not recording'));
      rec.onstop = () => resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
      rec.onerror = () => reject(new Error('recording failed'));
      if (rec.state !== 'inactive') rec.stop();
    });
  }

  release(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

/** Trim leading/trailing silence, normalize, and return a 22.05 kHz mono WAV. */
export async function cleanRecording(blob: Blob, ctx: AudioContext): Promise<Blob> {
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const data = mixdown(buf);
  const sr = buf.sampleRate;
  const thr = 0.015;
  let s = 0;
  let e = data.length - 1;
  while (s < data.length && Math.abs(data[s]) < thr) s++;
  while (e > s && Math.abs(data[e]) < thr) e--;
  const pad = Math.floor(sr * 0.05);
  s = Math.max(0, s - pad);
  e = Math.min(data.length, e + pad);
  let seg: Float32Array = data.slice(s, e);
  if (seg.length < sr * 0.05) seg = data; // nothing detected — keep everything
  // normalize
  let peak = 0;
  for (let i = 0; i < seg.length; i++) peak = Math.max(peak, Math.abs(seg[i]));
  const gainV = peak > 0 ? Math.min(0.9 / peak, 6) : 1;
  const fadeN = Math.min(Math.floor(sr * 0.008), Math.floor(seg.length / 2));
  for (let i = 0; i < seg.length; i++) {
    let v = seg[i] * gainV;
    if (i < fadeN) v *= i / fadeN;
    if (i >= seg.length - fadeN) v *= (seg.length - 1 - i) / fadeN;
    seg[i] = v;
  }
  const out = resample(seg, sr, 22050);
  return encodeWav(out, 22050);
}

function mixdown(buf: AudioBuffer): Float32Array {
  if (buf.numberOfChannels === 1) return new Float32Array(buf.getChannelData(0));
  const out = new Float32Array(buf.length);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) out[i] += d[i] / buf.numberOfChannels;
  }
  return out;
}

function resample(data: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return data;
  const ratio = from / to;
  const n = Math.floor(data.length / ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const i1 = Math.min(data.length - 1, i0 + 1);
    const f = x - i0;
    out[i] = data[i0] * (1 - f) + data[i1] * f;
  }
  return out;
}

function encodeWav(samples: Float32Array, sr: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
