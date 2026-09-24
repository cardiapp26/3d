// Optional schematic auscultation sound for the examination panel. Heart
// sounds are short low-frequency sine thumps; the murmur is filtered noise
// whose gain follows murmurEnvelope over each beat. It is a synthesized
// teaching caricature, not a recording. The AudioContext is created lazily on
// the first enable (which must come from a user gesture, autoplay rules).

import { phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { heartSoundEvents, murmurEnvelope } from './exam-findings.js';

const LOOKAHEAD_SEC = 0.35;     // schedule this far ahead of the audio clock
const TICK_MS = 90;             // scheduler period
const ENVELOPE_POINTS = 24;     // murmur gain ramp points per beat
const MASTER_GAIN = 0.32;       // modest overall volume
const MURMUR_GAIN = 0.55;
const THUMP_GAIN = 0.9;
const THUMP_SEC = 0.055;
const DEFAULT_THUMP_HZ = 55;
const THUMP_HZ = { S1: 52, A2: 64, P2: 68, S3: 40, S4: 44, OS: 70, C: 70, EC: 70 };

/** Filter per murmur pitch; unknown pitches use 'medium'. */
export const PITCH_FILTERS = Object.freeze({
  low: { type: 'lowpass', frequency: 150, Q: 0.7 },
  rumble: { type: 'lowpass', frequency: 150, Q: 0.7 },
  medium: { type: 'bandpass', frequency: 250, Q: 1.2 },
  harsh: { type: 'bandpass', frequency: 350, Q: 3 },
  blowing: { type: 'highpass', frequency: 400, Q: 0.7 },
  high: { type: 'highpass', frequency: 400, Q: 0.7 },
  musical: { type: 'bandpass', frequency: 180, Q: 14 }
});

/** Whether this environment can synthesize sound at all. */
export const audioSupported = () => Boolean(globalThis.AudioContext || globalThis.webkitAudioContext);

/**
 * @param {{ getParams: () => ({ findingId: string, physio: object, pitch: string, bpm: number, rhythm: string,
 *   phase: number, active: boolean }) | null }} options
 */
export function createExamAudio({ getParams }) {
  let ctx = null, master = null, filter = null, murmurGain = null, noise = null;
  let timer = 0, enabled = false, running = false, nextBeat = 0, pitchKey = '';

  function ensureContext() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    filter = ctx.createBiquadFilter();
    murmurGain = ctx.createGain();
    murmurGain.gain.value = 0;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(filter);
    filter.connect(murmurGain);
    murmurGain.connect(master);
    noise.start();
    return ctx;
  }

  function applyFilter(pitch) {
    if (pitch === pitchKey) return;
    pitchKey = pitch;
    const f = PITCH_FILTERS[pitch] || PITCH_FILTERS.medium;
    const now = ctx.currentTime;
    filter.type = f.type;
    filter.frequency.setValueAtTime(f.frequency, now);
    filter.Q.setValueAtTime(f.Q, now);
  }

  function thump(at, amp, hz) {
    const peak = THUMP_GAIN * Math.max(0.05, Math.min(1, amp));
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + THUMP_SEC);
    env.connect(master);
    // Fundamental plus a weak third partial so the thump survives small speakers.
    for (const [mult, gain] of [[1, 1], [3, 0.3]]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * mult * 1.25, at);
      osc.frequency.exponentialRampToValueAtTime(hz * mult, at + 0.03);
      g.gain.value = gain;
      osc.connect(g);
      g.connect(env);
      osc.start(at);
      osc.stop(at + THUMP_SEC + 0.02);
      osc.onended = () => { g.disconnect(); if (mult === 1) env.disconnect(); };
    }
  }

  function scheduleBeat(t0, p) {
    const bpm = p.bpm > 0 ? p.bpm : 72;
    const rr = 60 / bpm;
    const opts = { rhythm: p.rhythm || 'sinus' };
    for (const ev of heartSoundEvents(p.findingId, p.physio, opts)) {
      thump(t0 + phaseToTime(ev.u, bpm) * rr, ev.amp, THUMP_HZ[ev.label] || DEFAULT_THUMP_HZ);
    }
    const gain = murmurGain.gain;
    for (let j = 0; j <= ENVELOPE_POINTS; j++) {
      const tau = j / ENVELOPE_POINTS;
      const u = timeToPhase(Math.min(tau, 0.9999), bpm);
      gain.linearRampToValueAtTime(MURMUR_GAIN * murmurEnvelope(p.findingId, u, p.physio, opts), t0 + tau * rr);
    }
  }

  function silence() {
    if (!ctx || !running) return;
    running = false;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, 0.02);
    murmurGain.gain.cancelScheduledValues(now);
    murmurGain.gain.setTargetAtTime(0, now, 0.02);
  }

  function tick() {
    if (!enabled || !ctx) return;
    let p = null;
    try { p = getParams(); } catch { p = null; }
    if (!p || !p.active || !p.findingId) { silence(); return; }
    const bpm = p.bpm > 0 ? p.bpm : 72;
    const now = ctx.currentTime;
    if (!running) {
      running = true;
      // Start the first scheduled beat when the visual cycle next wraps to phase 0.
      const tau = Number.isFinite(p.phase) ? phaseToTime(p.phase, bpm) : 0;
      nextBeat = now + 0.05 + (1 - tau) * (60 / bpm);
      murmurGain.gain.cancelScheduledValues(now);
      murmurGain.gain.setValueAtTime(0, now);
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(MASTER_GAIN, now, 0.05);
    }
    applyFilter(p.pitch);
    if (nextBeat < now) nextBeat = now + 0.02;
    while (nextBeat < now + LOOKAHEAD_SEC) {
      scheduleBeat(nextBeat, p);
      nextBeat += 60 / bpm;
    }
  }

  function stop() {
    enabled = false;
    if (timer) clearInterval(timer);
    timer = 0;
    silence();
    const c = ctx;
    if (c) setTimeout(() => { if (!enabled && ctx === c && c.state === 'running') c.suspend().catch(() => {}); }, 150);
  }

  return {
    /** Turn sound on or off; returns whether sound is now on. Call on a user gesture. */
    setEnabled(on) {
      if (!on) { stop(); return false; }
      if (!ensureContext()) return false;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      enabled = true;
      running = false;
      if (!timer) timer = setInterval(tick, TICK_MS);
      tick();
      return true;
    },
    isEnabled: () => enabled,
    destroy() {
      stop();
      const c = ctx;
      ctx = null;
      if (c) c.close().catch(() => {});
    }
  };
}
