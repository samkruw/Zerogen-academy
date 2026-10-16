import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const entries = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png', ...(await readdir('dist/assets')).map(f => `assets/${f}`)];
const hash = createHash('sha256');
for (const file of entries) hash.update(await readFile(`dist/${file}`));
const version = hash.digest('hex').slice(0, 16);
const worker = `const PREFIX = 'zerogen:' + self.registration.scope + ':';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(entries)}.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(ASSETS[0])).then(response => response || fetch(event.request)));
  } else if (ASSETS.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(response => response || fetch(event.request)));
  }
});
`;
await writeFile('dist/sw.js', worker);
console.log(`App-Shell: ${entries.length} lokale Dateien, Version ${version}`);
