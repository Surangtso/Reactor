// Reactor 서비스 워커
// 기록은 개인적인 내용이라 페이지나 API 응답을 기기에 저장(캐시)하지 않는다.
// 오프라인일 때 보여줄 안내 화면 하나만 미리 저장해 둔다.

const CACHE = "reactor-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// 페이지 이동만 가로챈다: 평소엔 그대로 네트워크로, 연결이 끊겼을 때만 안내 화면.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
