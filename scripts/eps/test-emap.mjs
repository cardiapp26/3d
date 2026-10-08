// Mapping basics model (src/eps/emap-model.js): each teaching claim of the
// Mapping basics tab, read from the patch. Calibration (healthy tissue 4 mV
// bipolar with small electrodes); small electrodes show the 1 mm channel
// that a 3.5 mm tip records as scar (Cardiac Mapping chapter 16); a bipole
// along the wavefront reads low in healthy tissue and the larger of two
// directions restores it; voltage falls with contact; sparse points lose
// the channel in the interpolation; the unipolar signal sees the far field
// (higher than bipolar over scar); the annotation rules agree in healthy
// tissue and split on the double-component signal at the channel entrance.
import assert from 'node:assert/strict';
import { SITES, CATHETERS, CONTACTS, ANNOTATIONS, DENSITIES, NOISE, record, annotate, trueLat, buildMap, channelSeen, tissueAt } from '../../src/eps/emap-model.js';
import { EMAP_TEXT } from '../../src/eps/emap-text.js';

const rec = (site, opts) => record(SITES[site], opts);

// Calibration and tissue classes with the high-density catheter.
assert.ok(Math.abs(rec('healthy').bipolarV - 4) < 0.05, 'healthy reference 4 mV');
assert.ok(rec('healthy').bipolarV > 1.5, 'healthy: normal');
assert.ok(rec('scar').bipolarV < NOISE * 2, 'dense scar: near the noise level');
assert.equal(tissueAt(SITES.channel), 'channel');

// Electrode size: the channel reads as scar with the ablation tip, as viable tissue with small electrodes.
assert.ok(rec('channel', { catheter: 'ablation' }).bipolarV < 0.5, 'ablation catheter: channel < 0.5 mV');
for (const c of ['pentaray', 'orion']) assert.ok(rec('channel', { catheter: c }).bipolarV > 0.75, `${c}: channel above the scar cut-off`);
const dense = { spacing: 1, orientation: 'best' };
assert.ok(channelSeen(buildMap({ catheter: 'orion', ...dense })) > 0.9, 'mini basket at 1 mm: channel seen');
assert.ok(channelSeen(buildMap({ catheter: 'pentaray', ...dense })) > 0.9, 'high density at 1 mm: channel seen');
assert.ok(channelSeen(buildMap({ catheter: 'ablation', spacing: 1 })) < 0.5, 'ablation catheter: channel mostly hidden');

// Point density: sparse points lose the channel.
assert.ok(channelSeen(buildMap({ catheter: 'orion', spacing: 6, orientation: 'best' })) < 0.4, '6 mm spacing: channel lost');

// Wavefront direction: a bipole along the wave front reads low; the larger of two directions restores it.
const along = rec('healthy', { wave: 'top', orientation: 'x' }).bipolarV, across = rec('healthy', { wave: 'top', orientation: 'y' }).bipolarV;
assert.ok(along < 1.5 && across > 3, `parallel to the front ${along.toFixed(2)} vs across ${across.toFixed(2)}`);
assert.ok(rec('healthy', { wave: 'top', orientation: 'best' }).bipolarV > 3, 'best of both directions');
assert.equal(rec('healthy', { catheter: 'ablation', orientation: 'best' }).orientation, 'x', 'single bipole: no choice of direction');

// Contact: voltage falls as the electrode lifts off; poor contact turns healthy tissue into false border zone.
const byContact = Object.keys(CONTACTS).map((c) => rec('healthy', { contact: c }).bipolarV);
assert.ok(byContact[0] > byContact[1] && byContact[1] > byContact[2], 'voltage falls with contact');
assert.ok(byContact[2] < 1.5, 'poor contact: healthy tissue reads low');

// Unipolar sees the far field: over the channel and scar it stays higher than the bipolar.
assert.ok(rec('scar').unipolarV > 2 * rec('scar').bipolarV, 'unipolar higher than bipolar over scar');

// Annotation: rules agree in healthy tissue, split at the channel entrance.
const spread = (site) => { const r = rec(site); const t = ANNOTATIONS.map((a) => annotate(r, a)); return Math.max(...t) - Math.min(...t); };
assert.ok(spread('healthy') <= 5, `healthy: rules within 5 ms (${spread('healthy')})`);
assert.ok(spread('channelEnd') >= 15, `channel entrance: rules differ (${spread('channelEnd')})`);
assert.ok(Math.abs(annotate(rec('healthy'), 'unipolar') - trueLat('left', SITES.healthy)) <= 2, 'unipolar -dV/dt at the true activation');
assert.ok(trueLat('left', SITES.channel) > trueLat('left', SITES.channelEnd) + 20, 'slow conduction inside the channel');
const lat = buildMap({ kind: 'lat' });
assert.ok(lat.points.some((p) => p.value == null), 'no LAT where the signal is at noise level');
assert.deepEqual(DENSITIES, [1, 3, 6]);
assert.equal(Object.keys(CATHETERS).length, 3);

// Texts: every option in both languages.
for (const lang of ['tr', 'en']) {
  const x = EMAP_TEXT[lang];
  for (const id of Object.keys(CATHETERS)) assert.ok(x.catheters[id], `${lang} catheter ${id}`);
  for (const id of Object.keys(CONTACTS)) assert.ok(x.contacts[id], `${lang} contact ${id}`);
  for (const id of ANNOTATIONS) assert.ok(x.annotations[id] && x.marks[id], `${lang} annotation ${id}`);
  for (const id of DENSITIES) assert.ok(x.spacings[id], `${lang} spacing ${id}`);
  for (const id of Object.keys(SITES)) assert.ok(x.sites[id], `${lang} site ${id}`);
  for (const id of ['catheter', 'contact', 'orientation', 'spacing']) assert.ok(x.verdict.causes[id], `${lang} cause ${id}`);
}
console.log('PASS mapping basics model');
