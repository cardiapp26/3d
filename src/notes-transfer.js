export function sendNotes(notes, target = 'https://cardi.drtr.uk') {
  if (!notes.length) return Promise.reject(new Error('empty'));
  if (notes.length > 200 || notes.some(n => n.text.length > 100000) || notes.reduce((sum, n) => sum + n.text.length, 0) > 2000000) return Promise.reject(new Error('limit'));
  const origin = new URL(target).origin;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  return new Promise((resolve, reject) => {
    let popup;
    let timer;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); };
    function receive(event) {
      if (event.origin !== origin || event.source !== popup || event.data?.token !== token) return;
      if (event.data.type === 'cardia-notes-ready') popup.postMessage({ type: 'cardia-notes', token, notes }, origin);
      if (event.data.type === 'cardia-notes-ack') {
        cleanup();
        if (event.data.ok === true && event.data.count === notes.length) resolve(notes.length);
        else reject(new Error('save'));
      }
    }
    window.addEventListener('message', receive);
    popup = window.open(`${origin}/transfer.html#${new URLSearchParams({ origin: location.origin, token })}`, '_blank');
    if (!popup) { cleanup(); reject(new Error('popup')); return; }
    timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 30000);
  });
}
