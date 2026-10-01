/*
 * WebXR support (AR / MR / VR) for the 3D heart. Feature-detected buttons
 * start an immersive session on the existing renderer; the heart group is
 * scaled to room size and placed in front of the viewer, and its transform
 * is restored when the session ends. Pure presentation: no anatomy, lesson
 * or state logic lives here, and devices without WebXR see no button.
 */

const SESSION_MODES = [
  // Passthrough AR / MR headsets and WebXR-capable phones.
  { mode: 'immersive-ar', label: 'AR', scale: 0.11, position: [0, 1.15, -0.65] },
  // Fully immersive VR.
  { mode: 'immersive-vr', label: 'VR', scale: 0.2, position: [0, 1.3, -1.1] }
];

/**
 * @param {{ renderer: import('three').WebGLRenderer, subject: import('three').Group,
 *   container: HTMLElement, getLang?: () => string,
 *   onSessionStart?: () => void, onSessionEnd?: () => void }} deps
 * @returns {{ element: HTMLElement|null, isPresenting: () => boolean, endSession: () => void }}
 */
export function createXrSupport({ renderer, subject, container, getLang = () => 'tr', onSessionStart = () => {}, onSessionEnd = () => {} }) {
  const doc = container?.ownerDocument;
  const xr = globalThis.navigator?.xr;
  if (!doc || !xr || typeof xr.isSessionSupported !== 'function') {
    return { element: null, isPresenting: () => false, endSession: () => {} };
  }

  const bar = doc.createElement('div');
  bar.className = 'xr-buttons';
  bar.hidden = true;
  container.appendChild(bar);

  let session = null;
  const saved = { position: null, quaternion: null, scale: null };

  function restoreSubject() {
    if (!saved.position) return;
    subject.position.copy(saved.position);
    subject.quaternion.copy(saved.quaternion);
    subject.scale.copy(saved.scale);
    saved.position = null;
  }

  async function start(entry, button) {
    if (session) { session.end().catch(() => {}); return; }
    try {
      const requested = await xr.requestSession(entry.mode, { optionalFeatures: ['local-floor', 'hand-tracking'] });
      session = requested;
      renderer.xr.enabled = true;
      try { renderer.xr.setReferenceSpaceType('local-floor'); } catch { renderer.xr.setReferenceSpaceType('local'); }
      saved.position = subject.position.clone();
      saved.quaternion = subject.quaternion.clone();
      saved.scale = subject.scale.clone();
      // Room-scale placement: small enough to walk around, chest height.
      subject.scale.setScalar(entry.scale);
      subject.position.set(...entry.position);
      session.addEventListener('end', () => {
        session = null;
        restoreSubject();
        render();
        onSessionEnd();
      });
      onSessionStart();
      await renderer.xr.setSession(session);
      button.dataset.active = 'true';
      render();
    } catch {
      // Permission denied or the device refused the mode: the button stays, nothing breaks.
      session = null;
      restoreSubject();
      render();
      onSessionEnd();
    }
  }

  const buttons = [];
  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    for (const { button, entry } of buttons) {
      const active = Boolean(session);
      button.dataset.active = String(active);
      button.textContent = active
        ? (lang === 'en' ? 'Exit' : 'Çık')
        : entry.label;
      button.title = entry.mode === 'immersive-ar'
        ? (lang === 'en' ? 'View in your room (AR / MR headset or phone)' : 'Odanızda görüntüleyin (AR / MR başlık veya telefon)')
        : (lang === 'en' ? 'View in VR' : 'VR içinde görüntüleyin');
    }
  }

  for (const entry of SESSION_MODES) {
    xr.isSessionSupported(entry.mode).then((supported) => {
      if (!supported) return;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'xr-button';
      button.setAttribute('data-xr-mode', entry.mode);
      button.addEventListener('click', () => start(entry, button));
      bar.appendChild(button);
      buttons.push({ button, entry });
      bar.hidden = false;
      render();
    }).catch(() => {});
  }

  return {
    element: bar,
    render,
    isPresenting: () => Boolean(session),
    endSession() { if (session) session.end().catch(() => {}); }
  };
}
