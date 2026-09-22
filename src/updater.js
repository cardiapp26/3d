// Cardia PWA Updater (wiz3 style)
// Handles:
// - Service Worker registration (sw.js v9)
// - Network-first updates & controllerchange auto-reload
// - Header update button with .has-update glow & red notification dot
// - wiz3 style update prompt card with version info
// - Hard cache-purging update trigger
import { getTranslation } from './content.js';

let registration = null;
let reloadRequested = false;
let updatePromptShown = false;
let hasUpdateDetected = false;
let toastTimeout = null;

function getMeta(name, fallback = '') {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return (meta && meta.getAttribute('content')) || fallback;
}

export function showToast(message, duration = 3000) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    toast.hidden = true;
  }, duration);
}

function setUpdateBadge(hasUpdate) {
  hasUpdateDetected = hasUpdate;
  const headerBtn = document.querySelector('#header-update-btn');
  const dot = document.querySelector('#header-update-dot');
  if (headerBtn) {
    headerBtn.classList.toggle('has-update', hasUpdate);
  }
  if (dot) {
    dot.style.display = hasUpdate ? 'block' : 'none';
  }
}

export function showUpdatePrompt(info) {
  updatePromptShown = true;
  setUpdateBadge(true);

  const prompt = document.querySelector('#update-prompt');
  if (!prompt) return;

  const ver = (info && info.version) || getMeta('app-version', '1.9.0');
  const bld = (info && info.build) || getMeta('app-build', 'v9');
  const valEl = document.querySelector('#up-version-val');
  if (valEl) {
    valEl.textContent = `v${ver} (Build ${bld})`;
  }

  updateUpdaterLanguage();
  prompt.hidden = false;
}

export function dismissUpdatePrompt() {
  const prompt = document.querySelector('#update-prompt');
  if (prompt) {
    prompt.hidden = true;
  }
}

export async function triggerAppUpdate() {
  if (reloadRequested) return;
  reloadRequested = true;

  const btn = document.querySelector('#up-reload');
  const txt = document.querySelector('#up-reload-text');
  const icon = document.querySelector('#up-reload-icon');
  if (btn) btn.disabled = true;
  if (icon) icon.classList.add('up-spin');
  if (txt) txt.textContent = getTranslation('upReloading');

  const hardReload = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString(36));
    window.location.replace(url.toString());
  };

  const waiting = registration && registration.waiting;
  if (waiting) {
    try {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (_) {}
  }

  // Purge caches immediately
  try {
    if (typeof window !== 'undefined' && window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k).catch(() => false)));
    }
  } catch (_) {}

  // Fallback unregister and hard reload
  setTimeout(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(() => false)));
      }
    } catch (_) {}
    hardReload();
  }, 1000);
}

export async function checkVersionJsonFallback() {
  try {
    const res = await fetch('./version.json?_t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    const metaBuild = getMeta('app-build', 'v9');
    const metaVer = getMeta('app-version', '1.9.0');

    const hasNewBuild = Boolean(data.build && metaBuild && data.build !== metaBuild);
    const hasNewVersion = Boolean(data.version && metaVer && data.version !== metaVer);

    if (data && (hasNewBuild || hasNewVersion)) {
      showUpdatePrompt({ version: data.version, build: data.build });
      return true;
    }
  } catch (_) {}
  return false;
}

export async function checkAppUpdate(isManual = false) {
  const headerBtn = document.querySelector('#header-update-btn');
  const icon = headerBtn?.querySelector('.update-btn-icon');

  if (isManual) {
    if (headerBtn) headerBtn.disabled = true;
    if (icon) icon.classList.add('up-spin');
    showToast(getTranslation('upChecking'), 2000);
  }

  const finish = (hasUpdate, info) => {
    if (isManual) {
      if (headerBtn) headerBtn.disabled = false;
      if (icon) icon.classList.remove('up-spin');
    }
    if (hasUpdate) {
      showUpdatePrompt(info);
      showToast(getTranslation('upTitle'));
    } else if (isManual) {
      showToast(getTranslation('upUpToDate'));
    }
  };

  if (registration) {
    try {
      await registration.update();
      setTimeout(async () => {
        if (registration && registration.waiting) {
          let info = null;
          try {
            const res = await fetch('./version.json?_t=' + Date.now(), { cache: 'no-store' });
            if (res.ok) info = await res.json();
          } catch (_) {}
          finish(true, info);
        } else {
          const hasFallback = await checkVersionJsonFallback();
          if (!hasFallback) finish(false);
        }
      }, 750);
    } catch (_) {
      const hasFallback = await checkVersionJsonFallback();
      if (!hasFallback) finish(false);
    }
  } else {
    const hasFallback = await checkVersionJsonFallback();
    if (!hasFallback) finish(false);
  }
}

function watchWorker(sw, hadController) {
  sw.addEventListener('statechange', async () => {
    if (sw.state !== 'installed') return;
    if (hadController) {
      let info = null;
      try {
        const res = await fetch('./version.json?_t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) info = await res.json();
      } catch (_) {}
      showUpdatePrompt(info);
      showToast(getTranslation('upTitle'));
    } else {
      showToast(getTranslation('upOfflineReady'));
    }
  });
}

function watchRegistration(reg, hadController) {
  registration = reg;
  if (reg.waiting && navigator.serviceWorker.controller) {
    checkVersionJsonFallback().then(hasFallback => {
      if (!hasFallback) showUpdatePrompt();
    });
  }
  reg.addEventListener('updatefound', () => {
    if (reg.installing) {
      watchWorker(reg.installing, Boolean(navigator.serviceWorker.controller));
    }
  });
  if (reg.installing) {
    watchWorker(reg.installing, hadController);
  }
}

export function updateUpdaterLanguage() {
  const prompt = document.querySelector('#update-prompt');
  if (!prompt) return;

  const upTitle = prompt.querySelector('#up-title');
  if (upTitle) upTitle.textContent = getTranslation('upTitle');

  const upText = prompt.querySelector('#up-text');
  if (upText) upText.textContent = getTranslation('upDesc');

  const upVerLabel = prompt.querySelector('[data-i18n="upVersionLabel"]');
  if (upVerLabel) upVerLabel.textContent = getTranslation('upVersionLabel');

  const upLater = prompt.querySelector('#up-later');
  if (upLater) upLater.textContent = getTranslation('upLater');

  const upReloadText = prompt.querySelector('#up-reload-text');
  if (upReloadText && !reloadRequested) upReloadText.textContent = getTranslation('upReload');
}

export function initUpdater() {
  // Wire prompt buttons
  document.querySelector('#header-update-btn')?.addEventListener('click', () => {
    if (hasUpdateDetected) {
      showUpdatePrompt();
      return;
    }
    checkAppUpdate(true);
  });

  document.querySelector('#up-close')?.addEventListener('click', dismissUpdatePrompt);
  document.querySelector('#up-later')?.addEventListener('click', dismissUpdatePrompt);
  document.querySelector('#up-reload')?.addEventListener('click', triggerAppUpdate);

  // Check version.json fallback initially
  checkVersionJsonFallback();

  if (!('serviceWorker' in navigator)) {
    setInterval(checkVersionJsonFallback, 5 * 60 * 1000);
    return;
  }

  const hadController = Boolean(navigator.serviceWorker.controller);

  // controllerchange listener: triggered when a new SW takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // If the page had no controller on initial load, ignore the first claim
    if (!hadController) return;

    // Reload once when a new SW takes control after update
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        watchRegistration(reg, hadController);

        // Check for updates periodically every 60 seconds
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 1000);

        // Check when tab returns to foreground or window gains focus
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
            checkVersionJsonFallback();
          }
        });

        window.addEventListener('focus', () => {
          reg.update().catch(() => {});
        });
      })
      .catch(err => {
        console.warn('[sw] Registration failed:', err);
        setInterval(checkVersionJsonFallback, 5 * 60 * 1000);
      });
  });
}
