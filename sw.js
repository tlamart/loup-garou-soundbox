const CACHE = 'la-veillee-v2';
const ids = ['wolf','rooster','owl','night','wind','bells','thunder','witch','seer','cupid','hunter','girl','thief','shield','flute','crow','clap','boo','death','knell','heart','drum','clock','gavel','village','wolves','fail','scream','scratch','evil','goat','crickets'];
const FILES = ['./','index.html','credits.html','css/style.css','js/app.js','js/audio.js','js/sounds.js','js/sources.js','js/storage.js','assets/village.svg','assets/favicon.svg',...ids.map(id => `assets/audio/${id}.wav`)];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Delete only caches owned by this app (GitHub Pages may share an origin).
  for (const key of await caches.keys()) if (key.startsWith('la-veillee-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
  for (const client of await self.clients.matchAll()) client.postMessage('offline-ready');
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request); return cached || fetch(event.request);
  }));
});
