/* Gather service worker — uygulama kabuğunu (HTML + ikonlar) önbelleğe alır.
   KULLANICI VERİSİNE DOKUNMAZ: veriler localStorage'dadır ve service worker tarafından okunmaz/silinmez.
   Yeni sürüm yayınlarken CACHE adını değiştirin (ör. gather-shell-v0.7.1). */
const CACHE = 'gather-shell-v0.7.0';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-32.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-192.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('gather-shell-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    /* Sayfa: önce ağ (güncel sürüm), ağ yoksa önbellek (çevrimdışı) */
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  /* İkon/manifest gibi statik dosyalar: önce önbellek */
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
