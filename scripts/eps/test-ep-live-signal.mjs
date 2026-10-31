// Recorder signal of the live EP laboratory: pacing artifacts (a saturating pulse with an
// opposite after-potential on the paced bipole, a small spike on every other channel and the
// surface leads) and the peak-to-peak amplitude reading of the calipers.
import assert from 'node:assert/strict';
import { withStimArtifacts, waveValue, wavePeaks, channelEvents, STIM_ARTIFACT } from '../../src/eps/ep-waveform.js';
import { egmSample } from '../../src/eps/ep-egm.js';
import { peakToPeak, SATURATION_MV } from '../../src/eps/ep-user-caliper.js';
import { createLiveHeart, LIVE_CHANNELS } from '../../src/eps/ep-live-model.js';

// ---- withStimArtifacts ----
const table = { hra: [{ type: 'S', t: 100, amp: 0.5, sigma: 2 }, { type: 'A', t: 110, amp: 0.9, sigma: 3 }], rv: [{ type: 'V', t: 260, amp: 0.9, sigma: 4 }] };
const art = withStimArtifacts(table, ['ecg-ii', 'hra', 'rv']);
assert.notEqual(art, table, 'a new table');
assert.equal(table.hra[0].stim, undefined, 'input not mutated');
const near = art.hra.find((e) => e.type === 'S');
assert.equal(near.stim, 'near');
assert.equal(near.amp, STIM_ARTIFACT.near);
assert.equal(art.hra.filter((e) => e.type === 'S').length, 1, 'paced channel keeps one stimulus');
const farRv = art.rv.find((e) => e.type === 'S');
assert.equal(farRv.stim, 'far');
assert.equal(farRv.amp, STIM_ARTIFACT.far);
assert.ok(farRv.part, 'far spike is not named by the wave labels');
assert.equal(art['ecg-ii'][0].amp, STIM_ARTIFACT.surface, 'surface lead gets the smaller spike');
assert.deepEqual(art.rv.map((e) => e.t), [100, 260], 'sorted in time');
const plain = { rv: [{ type: 'V', t: 50, amp: 1, sigma: 4 }] };
assert.equal(withStimArtifacts(plain, LIVE_CHANNELS), plain, 'no stimulus: table unchanged');

// ---- artifact shapes ----
assert.equal(waveValue(101, near, 'hra'), STIM_ARTIFACT.near, 'flat top during the pulse');
assert.ok(waveValue(100 + STIM_ARTIFACT.pulse + 1, near, 'hra') < 0, 'opposite after-potential');
const a5 = Math.abs(waveValue(105, near, 'hra')), a30 = Math.abs(waveValue(130, near, 'hra'));
assert.ok(a30 < a5 * 0.3, 'after-potential decays');
assert.equal(waveValue(99, near, 'hra'), 0, 'nothing before the pulse');
assert.ok(waveValue(100, farRv, 'rv') > 0.25, 'far spike peaks at the stimulus');
assert.equal(waveValue(110, farRv, 'rv'), 0, 'far spike is brief');
assert.ok(wavePeaks(near).includes(100 + STIM_ARTIFACT.pulse), 'pulse end sampled');

// ---- surface leads carry the spike through the completed surface events ----
const surface = channelEvents({ events: art }, 'ecg-ii');
assert.ok(surface.some((e) => e.stim === 'far'), 'surface completion keeps the artifact');

// ---- peak-to-peak ----
const rec = { events: art, t0: 0 };
const ppNear = peakToPeak(rec, 'hra', 95, 140);
assert.ok(ppNear >= SATURATION_MV, `paced bipole reads as saturated (${ppNear})`);
assert.equal(peakToPeak(rec, 'rv', 140, 95), peakToPeak(rec, 'rv', 95, 140), 'order of the lines does not matter');
assert.equal(peakToPeak(rec, 'rv', 100, 100), null, 'empty window');
const ppV = peakToPeak(rec, 'rv', 230, 290);
assert.ok(ppV > 0.9 && ppV < 2.5, `near-field V peak-to-peak (${ppV})`);
let lo = Infinity, hi = -Infinity;
for (let t = 230; t <= 290; t += 0.1) { const v = egmSample(rec, 'rv', t); lo = Math.min(lo, v); hi = Math.max(hi, v); }
assert.ok(Math.abs(ppV - (hi - lo)) < 0.03, 'matches a dense sampling');

// ---- on the live heart: paced HRA drive ----
const heart = createLiveHeart('normal');
heart.advanceTo(2000);
heart.stimulate([{ t: 2200, site: 'hra' }, { t: 2800, site: 'hra' }]);
heart.advanceTo(3600);
const live = withStimArtifacts(heart.events(1800, 3600), LIVE_CHANNELS);
for (const ch of LIVE_CHANNELS) {
  const s = live[ch].filter((e) => e.type === 'S');
  assert.equal(s.length, 2, `${ch}: one artifact per stimulus`);
  assert.equal(s[0].stim, ch === 'hra' ? 'near' : 'far', `${ch}: artifact kind`);
}
assert.ok(peakToPeak({ events: live, t0: 0 }, 'cs-12', 2195, 2206) > 0.2, 'distant bipole shows the spike');

console.log('PASS ep-live-signal: pacing artifacts (saturating near pulse with after-potential, far and surface spikes), no mutation, peak-to-peak amplitude reading');
