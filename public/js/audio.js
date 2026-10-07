// Linggo ses motoru — tamamen sentezlenmiş, özgün efektler (dosya indirmeden):
// ortak mix → yumuşak kompresör → hafif oda yankısı. Pip'in kendi "konuşma" sesi de burada.
import { settings } from './store.js';

let ctx = null, master = null, wet = null;
const on = () => { try { return settings().sound !== false; } catch { return true; } };

function ac() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => { }); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
  master = ctx.createGain(); master.gain.value = 0.9;
  master.connect(comp).connect(ctx.destination);
  // tiny generated room (short, bright) — gives every sound a shared "space"
  const len = Math.floor(ctx.sampleRate * 0.9), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  wet = ctx.createGain(); wet.gain.value = 0.22;
  wet.connect(conv).connect(master);
  return ctx;
}
// unlock on first gesture (iOS)
['pointerdown', 'keydown'].forEach(e => addEventListener(e, () => { if (on()) ac(); }, { once: true, passive: true }));

function out(node, send = 1) { node.connect(master); if (send) { const s = ctx.createGain(); s.gain.value = send; node.connect(s).connect(wet); } }

// one enveloped voice: osc(s) → filter → gain
function voice({ f = 440, to = null, type = 'sine', t = 0, a = 0.005, d = 0.25, g = 0.2, q = 0, cut = 0, send = 1, detune = 0, glideT = 0.08 }) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + t;
  const o = c.createOscillator(), amp = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + glideT);
  amp.gain.setValueAtTime(0.0001, t0); amp.gain.exponentialRampToValueAtTime(g, t0 + a); amp.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  let n = o;
  if (cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = q; o.connect(fl); n = fl; }
  n.connect(amp); out(amp, send);
  o.start(t0); o.stop(t0 + a + d + 0.05);
}
// bell = sine + inharmonic partials (marimba/glock-ish, warm)
function bell(f, t = 0, g = 0.16, d = 0.5) {
  voice({ f, t, g, d, type: 'sine' });
  voice({ f: f * 2.76, t, g: g * 0.28, d: d * 0.45, type: 'sine' });
  voice({ f: f * 5.4, t, g: g * 0.08, d: d * 0.2, type: 'sine' });
  voice({ f: f * 2, t, g: g * 0.18, d: d * 0.6, type: 'triangle', cut: 3000 });
}
function noise({ t = 0, d = 0.2, g = 0.15, type = 'bandpass', f = 2000, to = null, q = 1, send = 0.6 }) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + t, len = Math.max(1, Math.floor(c.sampleRate * (d + 0.05)));
  const b = c.createBuffer(1, len, c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t0 + d);
  const amp = c.createGain(); amp.gain.setValueAtTime(0.0001, t0); amp.gain.exponentialRampToValueAtTime(g, t0 + 0.008); amp.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl).connect(amp); out(amp, send); s.start(t0); s.stop(t0 + d + 0.05);
}

export function haptic(p = 10) {
  try { if (settings().haptics && navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(p); } catch { }
}
const play = f => (...a) => { if (!on()) return; try { f(...a); } catch { } };
const N = n => 440 * Math.pow(2, (n - 69) / 12); // midi → Hz

// ---------- the palette (key of D major keeps everything friendly and related)
export const sfx = {
  tap: play(() => { noise({ d: 0.035, g: 0.09, f: 3200, q: 2.5, send: 0 }); voice({ f: 880, to: 1200, d: 0.05, g: 0.05, type: 'triangle', send: 0 }); haptic(5); }),
  select: play((i = 0) => { const s = [74, 76, 78, 81, 83, 86][i % 6]; voice({ f: N(s), d: 0.09, g: 0.07, type: 'triangle', cut: 4000, send: 0.3 }); haptic(4); }),
  ok: play(() => { bell(N(86), 0, 0.13, 0.45); bell(N(93), 0.075, 0.14, 0.7); noise({ t: 0.07, d: 0.25, g: 0.03, type: 'highpass', f: 7000 }); haptic(12); }),
  no: play(() => { voice({ f: 196, to: 150, d: 0.22, g: 0.14, type: 'triangle', cut: 900, glideT: 0.2 }); voice({ f: 147, to: 110, t: 0.09, d: 0.26, g: 0.12, type: 'sine', glideT: 0.2 }); noise({ d: 0.06, g: 0.05, f: 400, q: 1 }); haptic([22, 40, 22]); }),
  combo: play((n = 3) => { const base = 74 + Math.min(12, n); [0, 4, 7, 12].forEach((s, i) => bell(N(base + s), i * 0.055, 0.1, 0.4)); noise({ t: 0.18, d: 0.4, g: 0.035, type: 'highpass', f: 6000, to: 12000 }); haptic([10, 30, 10]); }),
  done: play(() => {
    [[62, 0], [66, 0.1], [69, 0.2], [74, 0.3]].forEach(([n, t]) => bell(N(n + 12), t, 0.12, 0.5));
    [62, 66, 69, 74].forEach(n => voice({ f: N(n), t: 0.42, d: 1.4, g: 0.05, type: 'sawtooth', cut: 1800, q: 0.7, detune: (Math.random() - .5) * 12 }));
    noise({ t: 0.4, d: 1.2, g: 0.05, type: 'highpass', f: 5000, to: 11000 });
    haptic([20, 40, 20, 40, 60]);
  }),
  coin: play((i = 0) => { const p = 1 + (i % 5) * 0.06; voice({ f: 1318 * p, d: 0.06, g: 0.08, type: 'square', cut: 5000, send: 0.3 }); voice({ f: 1760 * p, t: 0.055, d: 0.28, g: 0.08, type: 'square', cut: 6000, send: 0.4 }); }),
  pop: play(() => { voice({ f: 520, to: 980, d: 0.08, g: 0.1, type: 'sine', glideT: 0.05, send: 0.3 }); noise({ d: 0.03, g: 0.04, f: 2500, q: 3, send: 0 }); }),
  whoosh: play((up = true) => noise({ d: 0.35, g: 0.08, f: up ? 400 : 3000, to: up ? 3500 : 300, q: 1.4, send: 0.5 })),
  toast: play(() => { bell(N(81), 0, 0.07, 0.3); bell(N(88), 0.06, 0.06, 0.35); }),
  levelUp: play(() => {
    [62, 66, 69, 74, 78, 81, 86].forEach((n, i) => bell(N(n + 12), i * 0.06, 0.09, 0.45));
    [50, 57, 62, 66].forEach(n => voice({ f: N(n), t: 0.4, d: 1.6, g: 0.06, type: 'sawtooth', cut: 1400, q: 0.8, detune: (Math.random() - .5) * 14 }));
    noise({ t: 0.35, d: 1.4, g: 0.05, type: 'highpass', f: 4000, to: 12000 });
    haptic([30, 50, 30, 50, 90]);
  }),
  // chest: knock (tap n of total), crack & burst
  knock: play((k = 0) => { const f = 110 + k * 22; voice({ f, to: f * 0.7, d: 0.16, g: 0.22, type: 'sine', glideT: 0.12 }); noise({ d: 0.07, g: 0.12, f: 900 + k * 250, q: 1.2 }); voice({ f: 700 + k * 160, d: 0.06, g: 0.05, type: 'triangle' }); haptic(18 + k * 6); }),
  burst: play(() => {
    noise({ d: 0.5, g: 0.18, type: 'lowpass', f: 3000, to: 200, q: 0.5 });
    voice({ f: 80, to: 40, d: 0.5, g: 0.3, type: 'sine', glideT: 0.4 });
    [74, 78, 81, 86, 90, 93].forEach((n, i) => bell(N(n + 12), 0.12 + i * 0.045, 0.08, 0.6));
    noise({ t: 0.15, d: 1.3, g: 0.06, type: 'highpass', f: 6000, to: 13000 });
    haptic([40, 30, 60]);
  }),
  sparkle: play(() => { for (let i = 0; i < 5; i++) voice({ f: N(98 + [0, 4, 7, 11, 14][i]), t: i * 0.04, d: 0.18, g: 0.03, type: 'sine' }); }),
  swipe: play(() => noise({ d: 0.12, g: 0.05, f: 1800, to: 900, q: 2, send: 0 })),
};

// ---------- Pip's voice: chirpy gibberish syllables with a mood-dependent melody
const MOODS = {
  happy: { base: 72, steps: [0, 4, 7, 4, 9, 7], rate: 0.085 },
  wow: { base: 76, steps: [0, 7, 12, 7, 16], rate: 0.075 },
  sad: { base: 64, steps: [3, 2, 0, -2, -4], rate: 0.12 },
  think: { base: 69, steps: [0, 2, 0, 5, 2], rate: 0.11 },
  giggle: { base: 79, steps: [0, 3, 0, 3, 0, 3, 5], rate: 0.06 },
  ouch: { base: 70, steps: [7, 0], rate: 0.09 },
};
export const pipVoice = play((mood = 'happy', syll = 0) => {
  const m = MOODS[mood] || MOODS.happy, n = syll || (3 + ((Math.random() * 3) | 0));
  for (let i = 0; i < n; i++) {
    const t = i * m.rate * (0.85 + Math.random() * 0.3), step = m.steps[i % m.steps.length] + (Math.random() < 0.3 ? 2 : 0);
    const f = N(m.base + step);
    // two formant-ish layers → a cute vowel "bweep"
    voice({ f, to: f * (mood === 'sad' ? 0.9 : 1.12), t, d: m.rate * 0.9, g: 0.09, type: 'triangle', cut: 2600, q: 4, glideT: m.rate * 0.7, send: 0.35 });
    voice({ f: f * 2.01, t, d: m.rate * 0.6, g: 0.025, type: 'sine', send: 0.2 });
  }
});
