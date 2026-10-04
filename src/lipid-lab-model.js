/** Historical Friedewald teaching calculation, mg/dL only. Not a treatment model. */
export function lipidLabValues({ total, hdl, tg }) {
  if (![total, hdl, tg].every(value => Number.isFinite(value) && value >= 0)) return { error: 'invalid' };
  if (hdl > total) return { error: 'inconsistent' };
  const nonHdl = total - hdl;
  const estimate = nonHdl - tg / 5;
  return { nonHdl, ldl: tg >= 400 || estimate < 0 ? null : estimate, reason: tg >= 400 ? 'high-tg' : estimate < 0 ? 'negative' : null };
}
export const STATIN_INTENSITY = [
  { name: 'Atorvastatin', high: '40–80', moderate: '10–20', low: null },
  { name: 'Rosuvastatin', high: '20–40', moderate: '5–10', low: null },
  { name: 'Simvastatin', high: null, moderate: '20–40', low: '10' },
  { name: 'Pravastatin', high: null, moderate: '40–80', low: '10–20' },
  { name: 'Lovastatin', high: null, moderate: '40–80', low: '20' },
  { name: 'Fluvastatin', high: null, moderate: 'XL 80 / 40 BID', low: '20–40' },
  { name: 'Pitavastatin', high: null, moderate: '1–4', low: null },
];
