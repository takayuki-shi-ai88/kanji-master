// 漢字マスター Service Worker
// アプリ本体と KanjiVG の書き順データをキャッシュしてオフラインでも使えるようにする
const CACHE = "kanji-master-v1";
const APP_FILES = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isKanjiVG = url.hostname === "cdn.jsdelivr.net" || url.hostname === "raw.githubusercontent.com";
  const isApp = url.origin === self.location.origin;
  if (!isKanjiVG && !isApp) return;

  // キャッシュ優先、なければネットワークから取得してキャッシュ
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
