// Service Worker لتطبيق كوتشيات
// نسخة بسيطة وآمنة: تخزن شكل التطبيق (App Shell) فقط وتترك كل طلبات
// Firebase/الشبكة تمر مباشرة عشان ميحصلش تعارض مع البيانات اللحظية.

const CACHE_NAME = "kotshiyat-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // لا تتدخل أبدًا في طلبات Firebase / Firestore / Google APIs
  // ده مهم جدًا عشان تسجيل الدخول والبيانات اللحظية تفضل تشتغل صح
  if (
    url.includes("firebaseio.com") ||
    url.includes("firestore.googleapis.com") ||
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("firebaseapp.com")
  ) {
    return; // اسمح للمتصفح يتعامل معها طبيعي (بدون كاش)
  }

  // Network-first لباقي الملفات (يحدّث الكاش لو النت متاح، ويرجع للكاش لو النت مقطوع)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
