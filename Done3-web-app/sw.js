// Keeps Done working offline. Online, it always fetches the newest version first (so you're always up to date);
// offline, it uses the last copy it saved.
const CACHE = 'done3-v27';
const SHELL = ['./', 'index.html', 'bundle.js', 'styles.css', 'mobile.css', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // GitHub sync calls go straight to the network
  // ask for a fresh copy every time (also past GitHub's 10-minute cache), so a new version shows up straight away
  const fresh = url.pathname + url.search + (url.search ? '&' : '?') + '_=' + Date.now();
  e.respondWith(fetch(fresh, { cache: 'no-store', credentials: 'same-origin' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// tapping a notification opens Done
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});

// a reminder sent by your Mac while Done is closed (end-to-end encrypted; the browser decrypts it)
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch { m = { title: e.data ? e.data.text() : 'Done' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Done', { body: m.body || '', tag: m.tag || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { id: m.tag || '' } }));
});
