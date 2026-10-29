// Site root: the welcome page, or the 3D anatomy shell when the address carries a 3D route
// (`#/mode/...`, `#/structure/...`). Deep links and bookmarks of the 3D page keep working;
// the 3D bundle is loaded only when a route asks for it.

import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { DOMAINS, HOME_MODULES, BADGES, HOME_TEXT, DRTR_APPS } from './home-data.js';
import './home.css';

const ROUTE_RE = /^#\/(mode|structure)\//i;
const THUMBS = import.meta.glob('./thumbs/*.webp', { eager: true, query: '?url', import: 'default' });
const APP_THUMBS = import.meta.glob('./apps/*.webp', { eager: true, query: '?url', import: 'default' });

let booted = false;
let lang = 'tr';

const pick = (o) => o[lang === 'en' ? 'en' : 'tr'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = (s) => esc(s).split('\n').join('<br>');
const thumbUrl = (id) => THUMBS[`./thumbs/${id}.webp`] || '';
const appThumbUrl = (id) => APP_THUMBS[`./apps/${id}.webp`] || '';
const label = (v) => (typeof v === 'string' ? v : pick(v));

function boot3d() {
  if (booted) return;
  booted = true;
  document.getElementById('home')?.remove();
  document.body.classList.remove('home-page');
  import('../main.js');
}

function cardHtml(m, tone) {
  const badge = m.badge ? `<span class="home-badge home-badge-${m.badge}">${esc(pick(BADGES[m.badge]))}</span>` : '';
  return `
    <a class="home-card tone-${tone}" href="${m.path}" data-home-card="${m.id}">
      <span class="home-thumb"><img src="${thumbUrl(m.thumb)}" alt="" loading="lazy" decoding="async" width="640" height="400"></span>
      <span class="home-card-top"><span class="home-kicker">${esc(pick(m.kicker))}</span>${badge}</span>
      <ul class="home-points">${m.points.map((p) => `<li>${esc(pick(p))}</li>`).join('')}</ul>
      <span class="home-card-name"><span>${esc(pick(m.name))}</span><span class="home-arrow" aria-hidden="true">→</span></span>
    </a>`;
}

function appCardHtml(app) {
  return `
    <a class="home-app" href="${esc(app.url)}" target="_blank" rel="noopener" data-home-app="${app.id}">
      <span class="home-app-thumb"><img src="${appThumbUrl(app.thumb)}" alt="" loading="lazy" decoding="async" width="640" height="400"></span>
      <span class="home-app-name"><span>${esc(label(app.name))}</span><span class="home-app-arrow" aria-hidden="true">↗</span></span>
      <span class="home-app-desc">${esc(pick(app.description))}</span>
      <span class="home-app-host">${esc(new URL(app.url).host)}</span>
      <span class="home-sr">(${esc(pick(HOME_TEXT.drtrNewTab))})</span>
    </a>`;
}

function render() {
  const root = document.getElementById('home');
  if (!root) return;
  const t = HOME_TEXT;
  document.documentElement.lang = lang;
  document.title = pick(t.title);
  const groups = DOMAINS.map((d) => {
    const cards = HOME_MODULES.filter((m) => m.domain === d.id);
    return `
      <section class="home-group" aria-labelledby="home-group-${d.id}">
        <h3 id="home-group-${d.id}" class="home-group-title"><span class="dot tone-${d.tone}"></span>${esc(pick(d.label))}<span class="home-count">${cards.length}</span></h3>
        <div class="home-cards">${cards.map((m) => cardHtml(m, d.tone)).join('')}</div>
      </section>`;
  }).join('');
  root.innerHTML = `
    <header class="home-nav">
      <a class="home-brand" href="./" aria-label="Cardia">✳ <strong>CARDIA</strong></a>
      <nav class="home-links" aria-label="${lang === 'en' ? 'Page' : 'Sayfa'}">
        <a href="#home-modules" data-home-anchor>${esc(pick(t.navModules))}</a>
        <a href="#home-how" data-home-anchor>${esc(pick(t.navHow))}</a>
        <a href="#home-faq" data-home-anchor>${esc(pick(t.navFaq))}</a>
        <a href="#home-drtr" data-home-anchor>${esc(pick(t.navDrtr))}</a>
      </nav>
      <div class="home-nav-actions">
        <div class="home-lang" role="group" aria-label="Dil / Language">
          <button type="button" data-home-lang="tr" aria-pressed="${lang === 'tr'}">TR</button>
          <button type="button" data-home-lang="en" aria-pressed="${lang === 'en'}">EN</button>
        </div>
        <a class="home-nav-cta" href="./#/mode/anatomy">${esc(pick(t.navOpen))}</a>
      </div>
    </header>
    <main>
      <section class="home-hero">
        <h1>${lines(pick(t.heroTitle))}</h1>
        <div class="home-hero-side">
          <p>${esc(pick(t.heroLead))}</p>
          <div class="home-hero-actions">
            <a class="home-cta" href="./#/mode/anatomy">${esc(pick(t.heroCta))}</a>
            <a class="home-cta ghost" href="#home-modules" data-home-anchor>${esc(pick(t.heroAll))} ↓</a>
          </div>
          <small>${esc(pick(t.heroNote))}</small>
        </div>
      </section>
      <section class="home-modules" id="home-modules" aria-labelledby="home-modules-title">
        <h2 id="home-modules-title">${esc(pick(t.modulesTitle))} <span class="home-count">${HOME_MODULES.length}</span></h2>
        ${groups}
      </section>
      <section class="home-how" id="home-how" aria-labelledby="home-how-title">
        <h2 id="home-how-title">${lines(pick(t.howTitle))}</h2>
        <div class="home-principles">
          ${t.principles.map((p, i) => `<article><span class="home-num">0${i + 1}</span><h3>${esc(pick(p.title))}</h3><p>${esc(pick(p.text))}</p></article>`).join('')}
        </div>
      </section>
      <section class="home-faq" id="home-faq" aria-labelledby="home-faq-title">
        <h2 id="home-faq-title">${esc(pick(t.faqTitle))}</h2>
        <div class="home-faq-list">
          ${t.faq.map((f) => `<details><summary>${esc(pick(f.q))}</summary><p>${esc(pick(f.a))}</p></details>`).join('')}
        </div>
      </section>
      <section class="home-drtr" id="home-drtr" aria-labelledby="home-drtr-title">
        <h2 id="home-drtr-title">${esc(pick(t.drtrTitle))} <span class="home-count">${DRTR_APPS.length}</span></h2>
        <p class="home-drtr-lead">${esc(pick(t.drtrLead))}</p>
        <div class="home-apps">${DRTR_APPS.map(appCardHtml).join('')}</div>
      </section>
    </main>
    <footer class="home-footer">
      <span>✳ CARDIA</span>
      <span>${esc(pick(t.disclaimer))}</span>
    </footer>`;
  root.querySelectorAll('[data-home-lang]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.homeLang === lang) return;
    lang = b.dataset.homeLang;
    rememberLanguage(lang);
    render();
  }));
  // In-page anchors scroll without leaving a hash (a hash here is reserved for 3D routes).
  root.querySelectorAll('[data-home-anchor]').forEach((a) => a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));
}

function showHome() {
  const params = new URLSearchParams(location.search);
  lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
  document.body.classList.add('home-page');
  const root = document.createElement('div');
  root.id = 'home';
  document.body.prepend(root);
  render();
}

if (ROUTE_RE.test(location.hash)) boot3d();
else showHome();

window.addEventListener('hashchange', () => {
  if (ROUTE_RE.test(location.hash)) boot3d();
  else if (booted && !location.hash) location.reload(); // Back from a 3D route to the welcome page.
});

if (!booted && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).catch(() => {});
}
