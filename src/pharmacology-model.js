import { PHARMA_TOPICS } from './pharmacology-data.js';

export const pharmaText = (value, lang = 'tr') => value?.[lang] ?? value?.tr ?? '';
export const allPharmaCards = () => PHARMA_TOPICS.flatMap(topic => topic.cards);

export function findPharmaCards(topicId, query = '', lang = 'tr') {
  const cards = PHARMA_TOPICS.find(topic => topic.id === topicId)?.cards ?? [];
  const normalize = text => text.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').normalize('NFD').replace(/\p{M}/gu, '');
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return cards.filter(card => terms.every(term => normalize(Object.values(card).flatMap(value =>
    typeof value === 'object' && !Array.isArray(value) ? Object.values(value) : []).join(' ')).includes(term)));
}

// Fraction of a reference concentration, one compartment, first-order elimination.
// No absorption phase, repeated dose, active metabolite or patient-specific clearance.
export function remainingFraction(hours, halfLife) {
  if (!Number.isFinite(hours) || hours < 0 || !Number.isFinite(halfLife) || halfLife <= 0) throw new RangeError('Time must be nonnegative and half-life positive.');
  return 2 ** (-hours / halfLife);
}

export function concentrationCurve(halfLife, duration = 24) {
  return Array.from({ length: 49 }, (_, i) => {
    const hours = duration * i / 48;
    return { hours, fraction: remainingFraction(hours, halfLife) };
  });
}
