const C = 'hola-v28';

self.addEventListener('install', e =>
  e.waitUntil(self.skipWaiting())
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(
        ks.filter(k => k.startsWith('hola-') && k !== C)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  const r = e.request;
  const u = new URL(r.url);

  if (
    r.method !== 'GET' ||
    u.origin !== location.origin ||
    r.headers.has('range') ||
    r.destination === 'audio' ||
    u.pathname.endsWith('.mp3')
  ) return;

  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && res.status === 200) {
        const copy = res.clone();
        caches.open(C)
          .then(c => c.put(r, copy))
          .catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(r, {ignoreSearch: true})
        .then(res => res || (
          r.mode === 'navigate'
            ? caches.match('./index.html')
            : Response.error()
        ))
    )
  );
});
