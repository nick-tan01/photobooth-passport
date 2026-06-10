let audio: AudioContext | null = null;
let muted: boolean | null = null;
const KEY = "pb-muted";

export function isMuted(): boolean {
  if (muted === null) {
    try {
      muted = typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
    } catch {
      muted = false;
    }
  }
  return !!muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {
    // storage unavailable; in-memory flag still applies
  }
}

function ac(): AudioContext | null {
  if (typeof window === "undefined" || isMuted()) return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audio) audio = new AC();
  if (audio.state === "suspended") audio.resume().catch(() => {});
  return audio;
}

function noise(a: AudioContext, seconds: number): AudioBuffer {
  const b = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// Rubber stamp coming down: low sine drop + filtered noise burst.
export function playThunk(depth = 1) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(depth > 1 ? 85 : 120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  const og = a.createGain();
  og.gain.setValueAtTime(0.45, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  osc.connect(og).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.18);

  const src = a.createBufferSource();
  src.buffer = noise(a, 0.1);
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 300;
  const ng = a.createGain();
  ng.gain.setValueAtTime(0.35, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  src.connect(f).connect(ng).connect(a.destination);
  src.start(t);
}

// Mechanical shutter: mirror slap, two clicks.
export function playShutter() {
  const a = ac();
  if (!a) return;
  const click = (at: number, freq: number, vol: number) => {
    const src = a.createBufferSource();
    src.buffer = noise(a, 0.035);
    const f = a.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.03);
    src.connect(f).connect(g).connect(a.destination);
    src.start(at);
  };
  const t = a.currentTime;
  click(t, 1500, 0.5);
  click(t + 0.07, 2200, 0.35);
}

// Printer motor chug while the strip feeds out.
export function playMotor(durMs: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const dur = durMs / 1000;
  const src = a.createBufferSource();
  src.buffer = noise(a, dur + 0.1);
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 130;
  band.Q.value = 1.4;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.15);
  g.gain.setValueAtTime(0.3, t + Math.max(0.2, dur - 0.25));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const lfo = a.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 26;
  const lg = a.createGain();
  lg.gain.value = 0.11;
  lfo.connect(lg).connect(g.gain);
  src.connect(band).connect(g).connect(a.destination);
  src.start(t);
  lfo.start(t);
  lfo.stop(t + dur);
  src.stop(t + dur);
}

export function buzz(ms = 30) {
  if (typeof navigator !== "undefined") navigator.vibrate?.(ms);
}
