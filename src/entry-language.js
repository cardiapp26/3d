// First visit follows the country of entry. An explicit TR/EN click is kept.

const LANG_KEY = 'cardia_lang';
const EXPLICIT_KEY = 'cardia_lang_explicit';

export function languageForCountry(countryCode) {
  return String(countryCode || '').trim().toUpperCase() === 'TR' ? 'tr' : 'en';
}

export function timezoneLooksLikeTurkey() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Istanbul';
  } catch {
    return false;
  }
}

export function readStoredLanguage(storage) {
  try {
    const explicit = storage.getItem(EXPLICIT_KEY) === '1';
    const saved = storage.getItem(LANG_KEY);
    if (explicit && (saved === 'tr' || saved === 'en')) return saved;
  } catch {
    /* private storage */
  }
  return null;
}

export function initialLanguage(storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (store) {
    const saved = readStoredLanguage(store);
    if (saved) return saved;
  }
  return timezoneLooksLikeTurkey() ? 'tr' : 'en';
}

export async function fetchCountryCode(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl('https://get.geojs.io/v1/ip/country.json', {
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) throw new Error('country lookup failed');
  const data = await response.json();
  const code = data && (data.country || data.country_code);
  if (!code) throw new Error('country missing');
  return String(code);
}
